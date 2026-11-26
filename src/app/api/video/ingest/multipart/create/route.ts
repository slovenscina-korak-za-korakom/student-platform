import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, modulesTable, type VideoItemData } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import {
  abortSuperseded,
  casItemData,
  checkStartAllowed,
  conflictChanged,
  inFlightAssetKey,
  parseExpectedAssetKey,
} from "@/lib/video-ingest-guard"
import { abortMultipartUpload, createMultipartUpload } from "@/lib/s3"

/**
 * Video ingest (multipart), step 1 — large-file sibling of /api/video/ingest.
 * Mints an `assetKey`, marks the owning item `processing`, opens an S3 multipart
 * upload for the raw master, and returns { assetKey, rawKey, uploadId }. The
 * admin browser then uploads parts via presigned PUTs (see ./sign-parts) and
 * calls ./complete; assembling the object fires the same S3 ObjectCreated event
 * that triggers packaging, so everything downstream is unchanged.
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET). No user session.
 */

const SAFE_EXT = /^[a-z0-9]{2,5}$/i

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    console.warn("[video-ingest-mpu:create] 401 — missing/invalid VIDEO_INGEST_SECRET")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    moduleItemId?: unknown
    ext?: unknown
    contentType?: unknown
    replace?: unknown
    expectedAssetKey?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const moduleItemId = Number(body.moduleItemId)
  const ext = String(body.ext ?? "").toLowerCase()
  const contentType = String(body.contentType ?? "application/octet-stream")
  if (!Number.isInteger(moduleItemId) || !SAFE_EXT.test(ext)) {
    console.warn("[video-ingest-mpu:create] 400 — bad moduleItemId/ext", { moduleItemId, ext })
    return NextResponse.json({ error: "moduleItemId and a valid ext are required" }, { status: 400 })
  }

  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, moduleItemId),
    columns: { id: true, type: true, moduleId: true, data: true },
  })
  if (!item || item.type !== "video") {
    console.warn("[video-ingest-mpu:create] 404 — video module item not found", { moduleItemId })
    return NextResponse.json({ error: "Video module item not found" }, { status: 404 })
  }

  // Don't silently orphan an upload that's still in flight (see video-ingest-guard).
  const conflict = checkStartAllowed("video-ingest-mpu:create", moduleItemId, item.data, {
    replace: body.replace === true,
    expectedAssetKey: parseExpectedAssetKey(body.expectedAssetKey),
  })
  if (conflict) return conflict
  const superseded = inFlightAssetKey(item.data)

  const mod = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.id, item.moduleId),
    columns: { courseId: true },
  })
  if (!mod) {
    console.warn("[video-ingest-mpu:create] 404 — module not found", { moduleId: item.moduleId })
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const assetKey = `courses/${mod.courseId}/items/${moduleItemId}/${randomUUID()}`
  const rawKey = `raw/${assetKey}/master.${ext}`
  // Open the S3 upload BEFORE claiming the item: if S3 fails, the item is left
  // untouched instead of pointing at an upload that doesn't exist.
  const uploadId = await createMultipartUpload(rawKey, contentType)

  const data: VideoItemData = { provider: "s3hls", assetKey, status: "processing" }
  // Atomic: only wins if nobody changed the item since we read it (two tabs).
  if (!(await casItemData(moduleItemId, item.data, data))) {
    console.warn("[video-ingest-mpu:create] 409 — item changed concurrently", { moduleItemId })
    await abortMultipartUpload(rawKey, uploadId).catch(() => {})
    return conflictChanged(inFlightAssetKey(item.data))
  }
  if (superseded) await abortSuperseded("video-ingest-mpu:create", moduleItemId, superseded)

  console.log("[video-ingest-mpu:create] 200 — multipart opened", {
    moduleItemId,
    assetKey,
    rawKey,
    contentType,
    uploadId,
    envBucket: process.env.S3_VIDEO_BUCKET,
    envRegion: process.env.AWS_REGION,
  })

  return NextResponse.json({ assetKey, rawKey, uploadId })
}
