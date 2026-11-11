import { NextResponse } from "next/server"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { completeMultipartUpload, type CompletedPart } from "@/lib/s3"
import { parseRawKey } from "@/lib/ingest-multipart"

/**
 * Video ingest (multipart), step 3 — assemble the uploaded parts into the final
 * raw master. That write fires s3:ObjectCreated → packaging, which later calls
 * /api/video/ingest/complete (the *separate* packaging callback that flips the
 * item to `ready`). This route only talks to S3; it does not touch the DB.
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
