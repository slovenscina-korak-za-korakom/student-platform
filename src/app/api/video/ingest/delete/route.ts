import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { videoAssetsTable } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { deleteObject, deletePrefix } from "@/lib/s3"
import { itemIdOf, lockItem, publishedKeyOf, rowForKey } from "@/lib/video-assets"

/**
 * Video asset cleanup — called by the admin panel when a video module item is
 * deleted (for every version it had; the item row — and with it the
 * video_assets rows — is already gone) and for "Delete" on a single version in
 * the version history. We delete everything that belongs to the asset: the
 * encrypted HLS ladder, the AES key, any leftover raw master, and its
 * video_assets row. Refused (409) for the item's published version or an
 * upload that is still active.
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

  // Guard + drop the row first: a version that's still in use must not lose its files.
  const itemId = itemIdOf(assetKey)
  const refusal = await db.transaction(async (tx) => {
    const item = itemId != null ? await lockItem(tx, itemId) : null
    const row = await rowForKey(tx, assetKey)
    if (item && publishedKeyOf(item.data) === assetKey) return "This is the published version — publish another one first."
    if (row && (row.status === "uploading" || row.status === "packaging")) return `This upload is still ${row.status}.`
    if (row) await tx.delete(videoAssetsTable).where(eq(videoAssetsTable.id, row.id))
    return null
  })
  if (refusal) return NextResponse.json({ error: refusal, code: "ASSET_IN_USE" }, { status: 409 })

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
