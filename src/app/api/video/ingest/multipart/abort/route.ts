import { NextResponse } from "next/server"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { abortMultipartUpload } from "@/lib/s3"
import { parseRawKey } from "@/lib/ingest-multipart"

/**
 * Video ingest (multipart), cancel — aborts the S3 multipart upload so S3 drops
 * any parts already uploaded (otherwise they linger and cost money until the
 * lifecycle AbortIncompleteMultipartUpload rule reaps them). DB state is the
 * admin panel's concern: it restores the item's prior data on cancel.
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET).
 */

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { rawKey?: unknown; uploadId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = parseRawKey(body.rawKey)
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : ""
  if (!parsed || !uploadId) {
    return NextResponse.json({ error: "rawKey and uploadId are required" }, { status: 400 })
  }

  const rawKey = body.rawKey as string
  try {
    await abortMultipartUpload(rawKey, uploadId)
  } catch (err) {
    // Best-effort: a NoSuchUpload (already aborted/expired) is still "aborted".
    const msg = err instanceof Error ? err.message : "abort failed"
    console.warn("[video-ingest-mpu:abort] AbortMultipartUpload error (ignoring)", {
      rawKey,
      uploadId,
      msg,
    })
  }

  console.log("[video-ingest-mpu:abort] 200 — multipart aborted", { rawKey, uploadId })
  return NextResponse.json({ ok: true })
}
