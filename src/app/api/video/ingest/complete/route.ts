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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { assetKey?: unknown; durationSec?: unknown; rawKey?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const assetKey = String(body.assetKey ?? "")
  const durationSec = body.durationSec == null ? undefined : Number(body.durationSec)
  const rawKey = body.rawKey == null ? undefined : String(body.rawKey)

  // assetKey is `courses/<courseId>/items/<itemId>/<uuid>`.
  const itemId = Number(assetKey.match(/\/items\/(\d+)\//)?.[1])
  if (!assetKey || !Number.isInteger(itemId)) {
    return NextResponse.json({ error: "Valid assetKey is required" }, { status: 400 })
  }

  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, itemId),
    columns: { id: true, data: true },
  })
  const current = item?.data as VideoItemData | undefined
  if (!item || !current || current.provider !== "s3hls" || current.assetKey !== assetKey) {
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

  return NextResponse.json({ ok: true, itemId })
}
