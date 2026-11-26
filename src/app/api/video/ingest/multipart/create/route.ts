import { NextResponse } from "next/server"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { startUpload, type StartBody } from "@/lib/video-ingest-guard"

/**
 * Video ingest (multipart), step 1 — large-file sibling of /api/video/ingest.
 * Starts a new video_assets row (see startUpload for the in-flight/lease
 * rules), opens an S3 multipart upload for the raw master and returns
 * { assetKey, rawKey, uploadId }. The admin browser then uploads parts via
 * presigned PUTs (./sign-parts), pings ./heartbeat every 30 s, and calls
 * ./complete; assembling the object fires the S3 ObjectCreated event that
 * triggers packaging.
 *
 * Body also carries the file metadata (fileName, fileSize, fingerprint,
 * partSize) so another device can resume the same upload (Step 7).
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET). No user session.
 */

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    console.warn("[video-ingest-mpu:create] 401 — missing/invalid VIDEO_INGEST_SECRET")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: StartBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const started = await startUpload("video-ingest-mpu:create", body, "multipart")
  if (started instanceof NextResponse) return started

  return NextResponse.json({ assetKey: started.assetKey, rawKey: started.rawKey, uploadId: started.uploadId })
}
