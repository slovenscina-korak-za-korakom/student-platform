import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { videoAssetsTable } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { abortMultipartUpload, completeMultipartUpload, type CompletedPart } from "@/lib/s3"
import { parseRawKey } from "@/lib/ingest-multipart"
import { isUniqueViolation, lockItem, rowForKey } from "@/lib/video-assets"

/**
 * Video ingest (multipart), step 3 — assemble the uploaded parts into the final
 * raw master. That write fires s3:ObjectCreated → packaging, which later calls
 * /api/video/ingest/complete (the *separate* packaging callback).
 *
 * Decided on the upload's video_assets row, under the item lock:
 *   uploading (or failed) + matching uploadId → CompleteMultipartUpload, row → packaging
 *   packaging / ready / superseded            → 200 no-op (duplicate / retried request)
 *   discarded                                 → 409 UPLOAD_SUPERSEDED, multipart aborted
 *                                               (it was replaced; it must not get packaged)
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET).
 */

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { rawKey?: unknown; uploadId?: unknown; parts?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = parseRawKey(body.rawKey)
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : ""
  const rawParts = Array.isArray(body.parts) ? body.parts : null
  if (!parsed || !uploadId || !rawParts || rawParts.length === 0) {
    return NextResponse.json(
      { error: "rawKey, uploadId and a non-empty parts array are required" },
      { status: 400 }
    )
  }

  const parts: CompletedPart[] = []
  for (const p of rawParts) {
    const rec = p as { PartNumber?: unknown; ETag?: unknown }
    const PartNumber = Number(rec?.PartNumber)
    const ETag = String(rec?.ETag ?? "")
    if (!Number.isInteger(PartNumber) || PartNumber < 1 || !ETag) {
      return NextResponse.json(
        { error: "each part needs an integer PartNumber and an ETag" },
        { status: 400 }
      )
    }
    parts.push({ PartNumber, ETag })
  }

  const rawKey = body.rawKey as string
  const assetKey = parsed.assetKey

  type Outcome =
    | { kind: "assembled" }
    | { kind: "duplicate"; status: string }
    | { kind: "superseded" }
    | { kind: "mismatch" }
    | { kind: "notfound" }
    | { kind: "s3error"; msg: string }

  let outcome: Outcome
  try {
    outcome = await db.transaction(async (tx): Promise<Outcome> => {
      const item = await lockItem(tx, parsed.moduleItemId)
      if (!item) return { kind: "notfound" }
      const row = await rowForKey(tx, assetKey)
      if (!row) return { kind: "notfound" }

      if (row.status === "packaging" || row.status === "ready" || row.status === "superseded") {
        return { kind: "duplicate", status: row.status }
      }
      if (row.status === "discarded") return { kind: "superseded" }
      if (row.uploadId && row.uploadId !== uploadId) return { kind: "mismatch" }

      // S3 call inside the transaction: holding the item lock for the ~1 s it
      // takes means a concurrent discard can't slip in between "assembled" and
      // "marked packaging".
      try {
        await completeMultipartUpload(rawKey, uploadId, parts)
      } catch (err) {
        return { kind: "s3error", msg: err instanceof Error ? err.message : "complete failed" }
      }
      const now = new Date()
      await tx
        .update(videoAssetsTable)
        .set({ status: "packaging", packagingAt: now, pct: 100, paused: false, error: null, updatedAt: now })
        .where(eq(videoAssetsTable.id, row.id))
      return { kind: "assembled" }
    })
  } catch (err) {
    if (isUniqueViolation(err)) {
      // A failed row being revived while another upload is active.
      return NextResponse.json({ error: "Another upload is active for this video", code: "UPLOAD_CHANGED" }, { status: 409 })
    }
    throw err
  }

  switch (outcome.kind) {
    case "notfound":
      return NextResponse.json({ error: "No upload found for this rawKey" }, { status: 404 })
    case "mismatch":
      return NextResponse.json({ error: "uploadId does not match this upload" }, { status: 409 })
    case "duplicate":
      console.log("[video-ingest-mpu:complete] 200 — already assembled (duplicate complete)", { rawKey, status: outcome.status })
      return NextResponse.json({ ok: true, alreadyDone: true })
    case "superseded":
      console.warn("[video-ingest-mpu:complete] 409 — upload was discarded; aborting instead of assembling", { rawKey })
      await abortMultipartUpload(rawKey, uploadId).catch(() => {})
      return NextResponse.json(
        {
          error: "This upload was replaced by a newer one for the same video and has been discarded.",
          code: "UPLOAD_SUPERSEDED",
        },
        { status: 409 }
      )
    case "s3error":
      console.error("[video-ingest-mpu:complete] CompleteMultipartUpload failed", { rawKey, uploadId, parts: parts.length, msg: outcome.msg })
      return NextResponse.json({ error: outcome.msg }, { status: 502 })
    case "assembled":
      console.log("[video-ingest-mpu:complete] 200 — object assembled, packaging", { rawKey, parts: parts.length })
      return NextResponse.json({ ok: true })
  }
}
