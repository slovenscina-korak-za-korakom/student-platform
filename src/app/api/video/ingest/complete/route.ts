import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { videoAssetsTable } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { deleteObject } from "@/lib/s3"
import { itemIdOf, lockItem, publishRow, rowForKey, shouldAutoPublish } from "@/lib/video-assets"

/**
 * Video ingest, step 2 — the packaging worker calls this once the encrypted
 * HLS ladder + key are in S3.
 *
 * For a known assetKey this ALWAYS succeeds (nothing packaged is ever lost):
 * the video_assets row becomes `ready` with its duration. Then, under the item
 * lock, it is published (module_items.data → this asset, previous published
 * row → `superseded`) if it is still the item's current upload. If it was
 * discarded meanwhile, or a newer upload exists, it stays `ready` but
 * unpublished — selectable later in the admin's version history.
 *
 * The raw master is dropped best-effort (the `raw/` lifecycle rule is the
 * backstop). Repeat callbacks are a no-op 200. Unknown assetKey → 404 (the
 * worker logs it as `[recoverable]`).
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET).
 */

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    console.warn("[video-complete] 401 — missing/invalid VIDEO_INGEST_SECRET (Lambda secret ≠ app secret?)")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { assetKey?: unknown; durationSec?: unknown; rawKey?: unknown }
  try {
    body = await req.json()
  } catch {
    console.warn("[video-complete] 400 — invalid JSON body")
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const assetKey = String(body.assetKey ?? "")
  const durationSec = body.durationSec == null ? null : Math.round(Number(body.durationSec)) || null
  const rawKey = body.rawKey == null ? undefined : String(body.rawKey)
  const itemId = itemIdOf(assetKey)
  console.log("[video-complete] callback received", { assetKey, itemId, durationSec, rawKey })
  if (itemId == null) {
    console.warn("[video-complete] 400 — bad assetKey", { assetKey })
    return NextResponse.json({ error: "Valid assetKey is required" }, { status: 400 })
  }

  const result = await db.transaction(async (tx) => {
    const item = await lockItem(tx, itemId)
    if (!item) return { kind: "notfound" as const }
    const row = await rowForKey(tx, assetKey)
    if (!row) return { kind: "notfound" as const }

    if (row.status === "ready" || row.status === "superseded") {
      return { kind: "duplicate" as const }
    }
    const publish = await shouldAutoPublish(tx, row)
    const now = new Date()
    await tx
      .update(videoAssetsTable)
      .set({
        status: "ready",
        durationSec: durationSec ?? row.durationSec,
        readyAt: now,
        error: null,
        pct: 100,
        updatedAt: now,
      })
      .where(eq(videoAssetsTable.id, row.id))
    let replaced: string | null = null
    if (publish) replaced = await publishRow(tx, item, row, durationSec ?? row.durationSec)
    return { kind: "ready" as const, published: publish, replaced, previousStatus: row.status }
  })

  if (result.kind === "notfound") {
    // Most likely a different database than the one that minted the key
    // (worker APP_BASE_URL vs. admin MAIN_APP_URL mismatch), or the item was deleted.
    console.warn("[video-complete] 404 — unknown assetKey", { itemId, assetKey })
    return NextResponse.json({ error: "No matching processing asset" }, { status: 404 })
  }

  if (rawKey) await deleteObject(rawKey).catch(() => {})

  if (result.kind === "duplicate") {
    console.log("[video-complete] 200 — already ready (duplicate callback)", { itemId, assetKey })
    return NextResponse.json({ ok: true, itemId, alreadyReady: true })
  }
  console.log("[video-complete] 200 — asset ready", {
    itemId,
    assetKey,
    durationSec,
    published: result.published,
    replaced: result.replaced,
    previousStatus: result.previousStatus,
  })
  return NextResponse.json({ ok: true, itemId, published: result.published })
}
