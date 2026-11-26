import { NextResponse } from "next/server"
import { and, eq, isNull, lt, or } from "drizzle-orm"
import { db } from "@/db"
import { videoAssetsTable } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { HEARTBEAT_FRESH_MS } from "@/lib/video-assets"

/**
 * Upload heartbeat (Step 6) — the uploading admin browser pings every 30 s
 * (also while paused: paused = alive). Keeps the upload's lease fresh so other
 * tabs/devices see it as live and can't replace it.
 *
 * Body: { assetKey, pct, paused, clientId }. The lease belongs to one browser
 * tab (clientId). A ping from another tab only takes the lease over once the
 * holder's heartbeat is stale — that's how a resume on another device (Step 7)
 * claims an abandoned upload, atomically, in this one UPDATE.
 *
 *   200                        lease held/renewed
 *   409 TAKEN_OVER             another tab holds a fresh lease (e.g. the upload was
 *                              resumed elsewhere while this laptop slept) → stop
 *   409 UPLOAD_SUPERSEDED      the upload was discarded/replaced → stop
 *   409 NOT_UPLOADING          any other status (already packaging, …)
 * Auth: shared secret.
 */

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { assetKey?: unknown; pct?: unknown; paused?: unknown; clientId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const assetKey = typeof body.assetKey === "string" ? body.assetKey : ""
  if (!assetKey) return NextResponse.json({ error: "assetKey is required" }, { status: 400 })
  const pctNum = Number(body.pct)
  const pct = Number.isFinite(pctNum) ? Math.max(0, Math.min(100, Math.round(pctNum))) : null

  const clientId = typeof body.clientId === "string" && body.clientId ? body.clientId.slice(0, 100) : null

  const now = new Date()
  const staleBefore = new Date(now.getTime() - HEARTBEAT_FRESH_MS)
  const updated = await db
    .update(videoAssetsTable)
    .set({
      lastHeartbeatAt: now,
      ...(pct != null ? { pct } : {}),
      paused: body.paused === true,
      ...(clientId ? { clientId } : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(videoAssetsTable.assetKey, assetKey),
        eq(videoAssetsTable.status, "uploading"),
        clientId
          ? or(
              isNull(videoAssetsTable.clientId),
              eq(videoAssetsTable.clientId, clientId),
              isNull(videoAssetsTable.lastHeartbeatAt),
              lt(videoAssetsTable.lastHeartbeatAt, staleBefore)
            )
          : undefined
      )
    )
    .returning({ id: videoAssetsTable.id })
  if (updated.length > 0) return NextResponse.json({ ok: true })

  const row = await db.query.videoAssetsTable.findFirst({
    where: eq(videoAssetsTable.assetKey, assetKey),
    columns: { status: true },
  })
  if (!row) return NextResponse.json({ error: "Unknown upload" }, { status: 404 })
  const code =
    row.status === "discarded" ? "UPLOAD_SUPERSEDED" : row.status === "uploading" ? "TAKEN_OVER" : "NOT_UPLOADING"
  console.warn("[video-heartbeat] 409", { assetKey, status: row.status, code })
  return NextResponse.json({ error: `Upload is ${row.status}`, code, status: row.status }, { status: 409 })
}
