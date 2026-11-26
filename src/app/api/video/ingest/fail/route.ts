import { NextResponse } from "next/server"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, type VideoItemData } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"

/**
 * Video ingest, failure report. Called when packaging can't finish, so the item
 * shows "failed" in the admin instead of hanging in "processing" forever:
 *   - the worker container (index.mjs) on any error it can catch;
 *   - the dispatcher Lambda (dispatch.mjs) when no Fargate task could be started;
 *   - the task watcher Lambda (watcher.mjs) for crashes the worker can't report
 *     (OOM kill, image pull / ENI errors, StopTask, Spot interruption on the
 *     final attempt).
 *
 * Body: { assetKey, reason }. Only flips the row if it still holds this assetKey
 * and is `processing` — a report for a superseded/ready asset is a no-op.
 * Always 200 (idempotent; several reporters may fire for one failure).
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET).
 */

const ASSET_KEY_RE = /^courses\/\d+\/items\/(\d+)\/[0-9a-fA-F-]+$/
const MAX_REASON = 500

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    console.warn("[video-fail] 401 — missing/invalid VIDEO_INGEST_SECRET")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { assetKey?: unknown; reason?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const assetKey = typeof body.assetKey === "string" ? body.assetKey : ""
  const m = assetKey.match(ASSET_KEY_RE)
  if (!m) {
    console.warn("[video-fail] 400 — bad assetKey", { assetKey })
    return NextResponse.json({ error: "Valid assetKey is required" }, { status: 400 })
  }
  const itemId = Number(m[1])
  const reason = String(body.reason ?? "unknown error").slice(0, MAX_REASON)

  const data: VideoItemData = {
    provider: "s3hls",
    assetKey,
    status: "failed",
    error: reason,
    failedAt: new Date().toISOString(),
  }
  const updated = await db
    .update(moduleItemsTable)
    .set({ data })
    .where(
      and(
        eq(moduleItemsTable.id, itemId),
        eq(moduleItemsTable.type, "video"),
        sql`${moduleItemsTable.data}->>'assetKey' = ${assetKey}`,
        sql`${moduleItemsTable.data}->>'status' = 'processing'`
      )
    )
    .returning({ id: moduleItemsTable.id })

  if (updated.length === 0) {
    console.log("[video-fail] 200 — no-op (item no longer processing this asset)", { itemId, assetKey, reason })
    return NextResponse.json({ ok: true, updated: false })
  }
  console.warn("[video-fail] 200 — item marked failed", { itemId, assetKey, reason })
  return NextResponse.json({ ok: true, updated: true })
}
