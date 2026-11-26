import { NextResponse } from "next/server"
import { db } from "@/db"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { getText } from "@/lib/s3"
import { itemIdOf, lockItem, publishRow, rowForKey } from "@/lib/video-assets"

/**
 * Publish a specific version ("Use this version" / rollback in the admin's
 * version history). Allowed for `ready` (unpublished) and `superseded` rows
 * whose packaged files still exist. The previously published row becomes
 * `superseded`. Auth: shared secret.
 */

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { assetKey?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const assetKey = typeof body.assetKey === "string" ? body.assetKey : ""
  const itemId = itemIdOf(assetKey)
  if (itemId == null) return NextResponse.json({ error: "Valid assetKey is required" }, { status: 400 })

  // The packaged files must still be there (superseded assets are swept later).
  try {
    await getText(`hls/${assetKey}/master.m3u8`)
  } catch {
    return NextResponse.json({ error: "This version's files no longer exist in S3", code: "ASSET_MISSING" }, { status: 409 })
  }

  const result = await db.transaction(async (tx) => {
    const item = await lockItem(tx, itemId)
    if (!item) return { error: "Video module item not found", status: 404 }
    const row = await rowForKey(tx, assetKey)
    if (!row) return { error: "Unknown version", status: 404 }
    if (row.status !== "ready" && row.status !== "superseded") {
      return { error: `A ${row.status} upload can't be published`, status: 409 }
    }
    const replaced = await publishRow(tx, item, row, row.durationSec)
    return { replaced }
  })
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })

  console.log("[video-publish] 200", { assetKey, replaced: result.replaced })
  return NextResponse.json({ ok: true, replaced: result.replaced })
}
