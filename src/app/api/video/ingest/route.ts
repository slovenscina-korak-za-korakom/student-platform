import { NextResponse } from "next/server"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { startUpload, type StartBody } from "@/lib/video-ingest-guard"
import { presignPut } from "@/lib/s3"

/**
 * Video ingest, step 1 (single PUT, files < 100 MB). The admin platform POSTs
 * metadata for an existing `video` module item; we start a new video_assets
 * row (see startUpload for the in-flight/lease rules) and return a short-lived
 * presigned S3 PUT for the raw master. The admin PUTs the file straight to S3;
 * the S3 ObjectCreated event triggers packaging, which later calls
 * /api/video/ingest/complete. The published video is untouched until then.
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET). No user session.
 */

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    console.warn("[video-ingest] 401 — missing/invalid VIDEO_INGEST_SECRET")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: StartBody
  try {
    body = await req.json()
  } catch {
    console.warn("[video-ingest] 400 — invalid JSON body")
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const started = await startUpload("video-ingest", body, "single")
  if (started instanceof NextResponse) return started

  const uploadUrl = await presignPut(started.rawKey, started.contentType, 3600)
  let uploadHost = ""
  try {
    uploadHost = new URL(uploadUrl).host
  } catch {}
  console.log("[video-ingest] 200 — presigned PUT", {
    assetKey: started.assetKey,
    rawKey: started.rawKey,
    contentType: started.contentType,
    envBucket: process.env.S3_VIDEO_BUCKET,
    uploadHost,
  })

  return NextResponse.json({ assetKey: started.assetKey, uploadUrl, expiresInSec: 3600 })
}
