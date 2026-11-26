import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { modulesTable, videoAssetsTable } from "@/db/schema"
import { abortMultipartUpload, abortMultipartUploadsUnder, createMultipartUpload } from "@/lib/s3"
import {
  activeRow,
  isUniqueViolation,
  liveness,
  lockItem,
  pendingInfo,
  type VideoAssetRow,
} from "@/lib/video-assets"

/**
 * Starting an upload (/api/video/ingest and /api/video/ingest/multipart/create).
 *
 * Incident 2026-11-25: a second upload for the same item overwrote the first
 * one's assetKey, so the first upload's packaging callback was rejected and the
 * item hung in "processing". Now every upload is its own video_assets row and
 * starting one is decided under the item lock:
 *
 *   nothing active                       → start
 *   active + live (Step 6 lease)         → 423 UPLOAD_ACTIVE (hard block, with live %)
 *   active + stale, no `replace`         → 409 UPLOAD_IN_PROGRESS (admin asks "discard it?")
 *   active + stale, `replace`, but the
 *     admin confirmed a different key    → 409 UPLOAD_CHANGED
 *   active + stale, `replace`            → old row `discarded` (its multipart upload is
 *                                          aborted after commit), new row starts
 *
 * The published video (module_items.data) is never touched here — students keep
 * watching it until the new upload is packaged.
 */

const SAFE_EXT = /^[a-z0-9]{2,5}$/i

export type StartBody = {
  moduleItemId?: unknown
  ext?: unknown
  contentType?: unknown
  replace?: unknown
  expectedAssetKey?: unknown
  fileName?: unknown
  fileSize?: unknown
  fingerprint?: unknown
  partSize?: unknown
  durationSec?: unknown
  startedBy?: unknown
  startedByName?: unknown
  clientId?: unknown
  userAgent?: unknown
}

export type StartedUpload = { assetKey: string; rawKey: string; uploadId: string | null; contentType: string }
/** A refusal (NextResponse to return as-is) or the started upload. */
export type StartResult = NextResponse | StartedUpload

const str = (v: unknown, max = 500) => (typeof v === "string" && v.length > 0 ? v.slice(0, max) : null)
const int = (v: unknown) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Math.round(Number(v)) : null)

export async function startUpload(tag: string, body: StartBody, mode: "single" | "multipart"): Promise<StartResult> {
  const moduleItemId = Number(body.moduleItemId)
  const ext = String(body.ext ?? "").toLowerCase()
  const contentType = String(body.contentType ?? "application/octet-stream")
  if (!Number.isInteger(moduleItemId) || !SAFE_EXT.test(ext)) {
    console.warn(`[${tag}] 400 — bad moduleItemId/ext`, { moduleItemId, ext })
    return fail(NextResponse.json({ error: "moduleItemId and a valid ext are required" }, { status: 400 }))
  }
  const replace = body.replace === true
  const expectedAssetKey = str(body.expectedAssetKey)

  // courseId for the key (outside the transaction — it never changes).
  const item0 = await db.query.moduleItemsTable.findFirst({
    where: (t, { eq }) => eq(t.id, moduleItemId),
    columns: { id: true, type: true, moduleId: true },
  })
  if (!item0 || item0.type !== "video") {
    console.warn(`[${tag}] 404 — video module item not found`, { moduleItemId })
    return fail(NextResponse.json({ error: "Video module item not found" }, { status: 404 }))
  }
  const mod = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.id, item0.moduleId),
    columns: { courseId: true },
  })
  if (!mod) return fail(NextResponse.json({ error: "Module not found" }, { status: 404 }))

  const assetKey = `courses/${mod.courseId}/items/${moduleItemId}/${randomUUID()}`
  const rawKey = `raw/${assetKey}/master.${ext}`
  // Open the S3 upload BEFORE taking the lock (keeps the transaction short);
  // aborted again below if we don't win.
  const uploadId = mode === "multipart" ? await createMultipartUpload(rawKey, contentType) : null

  let superseded: VideoAssetRow | null = null
  let refusal: NextResponse | null = null
  try {
    await db.transaction(async (tx) => {
      const item = await lockItem(tx, moduleItemId)
      if (!item) {
        refusal = NextResponse.json({ error: "Video module item not found" }, { status: 404 })
        return
      }

      const active = await activeRow(tx, moduleItemId)
      if (active) {
        const l = liveness(active)
        if (l.live) {
          console.warn(`[${tag}] 423 — active upload/packaging in progress`, { moduleItemId, active: active.assetKey, reason: l.reason })
          refusal = NextResponse.json(
            {
              error:
                active.status === "packaging"
                  ? "This video is being packaged right now and can't be replaced until that finishes."
                  : "This video is being uploaded from another tab or device right now.",
              code: "UPLOAD_ACTIVE",
              pending: pendingInfo(active),
            },
            { status: 423 }
          )
          return
        }
        if (!replace) {
          console.warn(`[${tag}] 409 — stale upload in progress, replace not requested`, { moduleItemId, active: active.assetKey })
          refusal = NextResponse.json(
            {
              error: "An earlier upload for this video never finished. Pass replace: true to discard it.",
              code: "UPLOAD_IN_PROGRESS",
              pending: pendingInfo(active),
            },
            { status: 409 }
          )
          return
        }
        if (expectedAssetKey && expectedAssetKey !== active.assetKey) {
          console.warn(`[${tag}] 409 — active upload changed since the replace was confirmed`, { moduleItemId, active: active.assetKey, expectedAssetKey })
          refusal = changed(active)
          return
        }
        await tx
          .update(videoAssetsTable)
          .set({ status: "discarded", error: "replaced by a newer upload", updatedAt: new Date() })
          .where(eq(videoAssetsTable.id, active.id))
        superseded = active
      }

      const now = new Date()
      await tx.insert(videoAssetsTable).values({
        moduleItemId,
        assetKey,
        status: "uploading",
        uploadId,
        rawKey,
        partSize: int(body.partSize),
        fileName: str(body.fileName, 255),
        fileSize: int(body.fileSize),
        fingerprint: str(body.fingerprint, 100),
        // Source duration measured in the browser → packaging ETA on every device;
        // the worker's probed duration overwrites it when packaging finishes.
        durationSec: int(body.durationSec),
        startedBy: str(body.startedBy, 100),
        startedByName: str(body.startedByName, 255),
        clientId: str(body.clientId, 100),
        userAgent: str(body.userAgent, 500),
        lastHeartbeatAt: now,
        pct: 0,
        createdAt: now,
        updatedAt: now,
      })
    })
  } catch (err) {
    if (uploadId) await abortMultipartUpload(rawKey, uploadId).catch(() => {})
    if (isUniqueViolation(err)) {
      console.warn(`[${tag}] 409 — concurrent start lost the race`, { moduleItemId })
      return fail(changed(null))
    }
    throw err
  }

  if (refusal) {
    if (uploadId) await abortMultipartUpload(rawKey, uploadId).catch(() => {})
    return fail(refusal)
  }
  if (superseded) await abortSuperseded(tag, moduleItemId, superseded)
  console.log(`[${tag}] started upload`, { moduleItemId, assetKey, mode, replaced: (superseded as VideoAssetRow | null)?.assetKey ?? null })
  return { assetKey, rawKey, uploadId, contentType }
}

function fail(response: NextResponse): StartResult {
  return response
}

function changed(active: VideoAssetRow | null): NextResponse {
  return NextResponse.json(
    {
      error: "Another upload for this video was started in the meantime. Reload and try again.",
      code: "UPLOAD_CHANGED",
      pending: active ? pendingInfo(active) : null,
    },
    { status: 409 }
  )
}

/** Best-effort: make sure a discarded upload can never complete. */
async function abortSuperseded(tag: string, moduleItemId: number, row: VideoAssetRow): Promise<void> {
  try {
    if (row.rawKey && row.uploadId) {
      await abortMultipartUpload(row.rawKey, row.uploadId)
    } else {
      await abortMultipartUploadsUnder(`raw/${row.assetKey}/`)
    }
    console.log(`[${tag}] aborted superseded upload`, { moduleItemId, supersededKey: row.assetKey })
  } catch (err) {
    // Not fatal: multipart/complete refuses discarded rows anyway.
    console.warn(`[${tag}] could not abort superseded multipart upload`, {
      moduleItemId,
      supersededKey: row.assetKey,
      msg: err instanceof Error ? err.message : String(err),
    })
  }
}
