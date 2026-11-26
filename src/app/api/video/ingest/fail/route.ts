import { NextResponse } from "next/server"
import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { videoAssetsTable } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { itemIdOf, lockItem } from "@/lib/video-assets"

/**
 * Video ingest, failure report. Called when packaging can't finish, so the
 * admin shows "failed" instead of "processing" forever:
 *   - the worker container (index.mjs) on any error it can catch;
 *   - the dispatcher Lambda (dispatch.mjs) when no Fargate task could be started;
 *   - the task watcher Lambda (watcher.mjs) for crashes the worker can't report.
 *
 * Body: { assetKey, reason }. Marks the upload's video_assets row `failed` if it
 * is still uploading/packaging. The PUBLISHED video (module_items.data) is
 * never touched — students keep watching it. Always 200 (idempotent; several
 * reporters may fire for one failure). Auth: shared secret.
 */

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
  const itemId = itemIdOf(assetKey)
  if (itemId == null) {
    console.warn("[video-fail] 400 — bad assetKey", { assetKey })
    return NextResponse.json({ error: "Valid assetKey is required" }, { status: 400 })
  }
  const reason = String(body.reason ?? "unknown error").slice(0, MAX_REASON)

  const updated = await db.transaction(async (tx) => {
    if (!(await lockItem(tx, itemId))) return []
    const now = new Date()
    return tx
      .update(videoAssetsTable)
      .set({ status: "failed", error: reason, failedAt: now, updatedAt: now })
      .where(and(eq(videoAssetsTable.assetKey, assetKey), inArray(videoAssetsTable.status, ["uploading", "packaging"])))
      .returning({ id: videoAssetsTable.id })
  })

  if (updated.length === 0) {
    console.log("[video-fail] 200 — no-op (upload not active)", { itemId, assetKey, reason })
    return NextResponse.json({ ok: true, updated: false })
  }
  console.warn("[video-fail] 200 — upload marked failed", { itemId, assetKey, reason })
  return NextResponse.json({ ok: true, updated: true })
}
