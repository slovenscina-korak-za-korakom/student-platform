import { NextResponse } from "next/server"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { listParts } from "@/lib/s3"
import { parseRawKey } from "@/lib/ingest-multipart"

/**
 * Video ingest (multipart), resume reconcile — after a page reload the browser
 * re-selects the same file and asks which parts S3 already stored, so it only
 * re-uploads the missing ones. Returns { parts: [{ PartNumber, ETag }] }.
 *
 * A 410 means the upload no longer exists (expired/aborted) → the client should
 * discard its saved session and start over. Auth: shared secret.
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
    const parts = await listParts(rawKey, uploadId)
    console.log("[video-ingest-mpu:list-parts] 200 — reconciled", {
      rawKey,
      uploadId,
      parts: parts.length,
    })
    return NextResponse.json({ parts })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "list failed"
    console.warn("[video-ingest-mpu:list-parts] 410 — upload gone", { rawKey, uploadId, msg })
    return NextResponse.json({ error: msg, parts: null }, { status: 410 })
  }
}
