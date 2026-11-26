import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { videoAssetsTable } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { itemIdOf, lockItem, rowForKey } from "@/lib/video-assets"

/**
 * Packaging started — the worker calls this before downloading the master.
 *
 *   uploading / packaging / failed → row `packaging`, packagingAt = now
 *     (covers single-PUT uploads, which have no multipart/complete step, and
 *     the watcher's on-demand retry)
 *   discarded                      → { proceed: false }: the upload was replaced,
 *     so the worker exits without spending an encode on it
 *   ready / superseded             → { proceed: false } (already packaged)
 *   unknown assetKey               → { proceed: true } (don't block packaging on
 *     a DB mismatch; the complete callback will 404 and log it)
 *
 * Best-effort from the worker's side: if this call fails it packages anyway.
 * Auth: shared secret.
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

  const result = await db.transaction(async (tx) => {
    if (!(await lockItem(tx, itemId))) return { proceed: true, status: null as string | null }
    const row = await rowForKey(tx, assetKey)
    if (!row) return { proceed: true, status: null as string | null }
    if (row.status === "discarded" || row.status === "ready" || row.status === "superseded") {
      return { proceed: false, status: row.status as string }
    }
    const now = new Date()
    await tx
      .update(videoAssetsTable)
      .set({ status: "packaging", packagingAt: now, pct: 100, paused: false, error: null, updatedAt: now })
      .where(eq(videoAssetsTable.id, row.id))
    return { proceed: true, status: "packaging" }
  })

  console.log("[video-started]", { assetKey, ...result })
  return NextResponse.json({ ok: true, ...result })
}
