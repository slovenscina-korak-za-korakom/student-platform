import { NextResponse } from "next/server"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { deleteObject, deletePrefix } from "@/lib/s3"

/**
 * Video asset cleanup — called by the admin panel when a video module item is
 * deleted. The assetKey lives only on the DB row, so the admin captures it and
 * calls this *before* dropping the row. We delete everything that belongs to the
 * asset: the encrypted HLS ladder, the AES key, and any leftover raw master.
 *
 * Each prefix is best-effort and isolated — one failure doesn't block the others
 * (and the admin treats the whole call as best-effort too). Auth: shared secret.
 */

// assetKey = courses/<courseId>/items/<itemId>/<uuid> — never an arbitrary prefix.
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

  let hls = 0
  let raw = 0
  let key = false
  try {
    hls = await deletePrefix(`hls/${assetKey}/`)
  } catch (err) {
    console.error("[video-ingest:delete] hls/ cleanup failed", { assetKey, err })
  }
  try {
    raw = await deletePrefix(`raw/${assetKey}/`)
  } catch (err) {
    console.error("[video-ingest:delete] raw/ cleanup failed", { assetKey, err })
  }
  try {
    await deleteObject(`keys/${assetKey}.key`)
    key = true
  } catch (err) {
    console.error("[video-ingest:delete] keys/ cleanup failed", { assetKey, err })
  }

  console.log("[video-ingest:delete] 200 — cleaned", { assetKey, hls, raw, key })
  return NextResponse.json({ ok: true, hls, raw, key })
}
