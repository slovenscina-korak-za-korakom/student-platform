import { NextResponse } from "next/server"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { deleteObject } from "@/lib/s3"

/**
 * PDF asset cleanup — called by the admin panel when a PDF module item is
 * deleted. A PDF is a single object at `pdf/<assetKey>.pdf`; the admin captures
 * the assetKey before dropping the row and calls this to free it. Best-effort.
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET).
 */

// assetKey = courses/<courseId>/items/<itemId>/<uuid>
const ASSET_KEY_RE = /^courses\/\d+\/items\/\d+\/[0-9a-fA-F-]+$/

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { assetKey?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const assetKey = typeof body.assetKey === "string" ? body.assetKey : ""
  if (!ASSET_KEY_RE.test(assetKey)) {
    return NextResponse.json({ error: "a valid assetKey is required" }, { status: 400 })
  }

  let deleted = false
  try {
    await deleteObject(`pdf/${assetKey}.pdf`)
    deleted = true
  } catch (err) {
    console.error("[pdf-ingest:delete] cleanup failed", { assetKey, err })
  }

  console.log("[pdf-ingest:delete] 200 — cleaned", { assetKey, deleted })
  return NextResponse.json({ ok: true, deleted })
}
