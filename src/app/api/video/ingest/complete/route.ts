import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, type VideoItemData } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { deleteObject } from "@/lib/s3"

/**
 * Video ingest, step 2. The packaging worker
 * calls this once the encrypted HLS ladder + key are in S3. We flip the owning
 * module item to `ready` and record its duration; the item then streams. The
 * raw master is dropped best-effort (an S3 lifecycle rule on `raw/` is the
 * backstop). Auth: shared secret (Bearer VIDEO_INGEST_SECRET).
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
  const durationSec = body.durationSec == null ? undefined : Number(body.durationSec)
  const rawKey = body.rawKey == null ? undefined : String(body.rawKey)

  // assetKey is `courses/<courseId>/items/<itemId>/<uuid>`.
  const itemId = Number(assetKey.match(/\/items\/(\d+)\//)?.[1])
  console.log("[video-complete] callback received", { assetKey, itemId, durationSec, rawKey })
  if (!assetKey || !Number.isInteger(itemId)) {
    console.warn("[video-complete] 400 — bad assetKey", { assetKey })
    return NextResponse.json({ error: "Valid assetKey is required" }, { status: 400 })
  }

  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, itemId),
    columns: { id: true, data: true },
  })
  const current = item?.data as VideoItemData | undefined
  if (!item || !current || current.provider !== "s3hls" || current.assetKey !== assetKey) {
    // Causes, most likely first:
    //  1. Superseded upload — a newer upload for this item was started while
    //     this one was in flight, overwriting the assetKey. The packaged output
    //     in hls/<assetKey>/ is fine; point the row back at it to recover.
    //  2. This app is on a different database than the one that minted the
    //     assetKey (worker APP_BASE_URL vs. admin MAIN_APP_URL mismatch).
    console.warn("[video-complete] 404 — no matching processing asset (superseded upload or wrong DB)", {
      itemId,
      found: !!item,
      storedAssetKey: current && "assetKey" in current ? current.assetKey : null,
      expectedAssetKey: assetKey,
    })
    return NextResponse.json({ error: "No matching processing asset" }, { status: 404 })
  }

  const data: VideoItemData = {
    provider: "s3hls",
    assetKey,
    status: "ready",
    durationSec: durationSec ?? current.durationSec,
  }
  await db.update(moduleItemsTable).set({ data }).where(eq(moduleItemsTable.id, itemId))

  if (rawKey) await deleteObject(rawKey).catch(() => {})

  console.log("[video-complete] 200 — item flipped to ready", { itemId, durationSec })
  return NextResponse.json({ ok: true, itemId })
}
