import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, type VideoItemData } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { abortMultipartUpload, completeMultipartUpload, type CompletedPart } from "@/lib/s3"
import { casItemData } from "@/lib/video-ingest-guard"
import { parseRawKey } from "@/lib/ingest-multipart"

/**
 * Video ingest (multipart), step 3 — assemble the uploaded parts into the final
 * raw master. That write fires s3:ObjectCreated → packaging, which later calls
 * /api/video/ingest/complete (the *separate* packaging callback that flips the
 * item to `ready`).
 *
 * Before assembling, we check the item still belongs to THIS upload. Since
 * replacing an in-flight upload is now explicit (409 unless `replace`) and
 * atomic (compare-and-swap in create), an upload whose assetKey the item no
 * longer holds was deliberately superseded: it must NOT be assembled (that
 * would package an orphan whose callback 404s). We answer 409
 * UPLOAD_SUPERSEDED and abort it in S3. (This replaces the Step-0 stopgap that
 * re-claimed the item for whichever upload finished.)
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

  // The item must still belong to this upload (see header).
  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, parsed.moduleItemId),
    columns: { id: true, type: true, data: true },
  })
  if (!item || item.type !== "video") {
    return NextResponse.json({ error: "Video module item not found" }, { status: 404 })
  }
  const prev = item.data as VideoItemData | null
  const prevKey = prev && "provider" in prev && prev.provider === "s3hls" ? prev.assetKey : null
  const prevStatus = prev && "provider" in prev && prev.provider === "s3hls" ? prev.status : undefined

  if (prevKey !== parsed.assetKey) {
    console.warn("[video-ingest-mpu:complete] 409 — upload was superseded; aborting instead of assembling", {
      moduleItemId: parsed.moduleItemId,
      assetKey: parsed.assetKey,
      currentKey: prevKey,
      currentStatus: prevStatus,
    })
    await abortMultipartUpload(rawKey, uploadId).catch(() => {})
    return NextResponse.json(
      {
        error: "This upload was replaced by a newer one for the same video and has been discarded.",
        code: "UPLOAD_SUPERSEDED",
      },
      { status: 409 }
    )
  }
  if (prevStatus === "ready") {
    // Duplicate call (e.g. a retried request whose first attempt succeeded and
    // was already packaged). Nothing to do — never flip a ready item back.
    console.log("[video-ingest-mpu:complete] 200 — already ready (duplicate complete)", { rawKey })
    return NextResponse.json({ ok: true, alreadyReady: true })
  }
  if (prevStatus !== "processing") {
    // Same key but `failed` (e.g. a stale report): this upload is demonstrably
    // alive, so put it back to processing.
    const data: VideoItemData = { provider: "s3hls", assetKey: parsed.assetKey, status: "processing" }
    if (!(await casItemData(parsed.moduleItemId, item.data, data))) {
      return NextResponse.json({ error: "Item changed concurrently, retry", code: "UPLOAD_CHANGED" }, { status: 409 })
    }
  }

  try {
    await completeMultipartUpload(rawKey, uploadId, parts)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "complete failed"
    console.error("[video-ingest-mpu:complete] CompleteMultipartUpload failed", {
      rawKey,
      uploadId,
      parts: parts.length,
      msg,
    })
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  console.log("[video-ingest-mpu:complete] 200 — object assembled", {
    rawKey,
    uploadId,
    parts: parts.length,
    moduleItemId: parsed.moduleItemId,
  })
  return NextResponse.json({ ok: true })
}
