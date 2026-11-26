import { and, desc, eq, gt, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
  moduleItemsTable,
  videoAssetsTable,
  type VideoAssetStatus,
  type VideoItemData,
} from "@/db/schema"

/**
 * Video asset lifecycle on top of the `video_assets` table (see the table's
 * doc comment in src/db/schema.ts and VIDEO_PIPELINE_HARDENING_PLAN.md,
 * Steps 4–7). Every write that decides "who owns this item" runs inside a
 * transaction holding the module_items row lock (`lockItem`), so two starts, a
 * start and a callback, or a callback and a discard can never interleave.
 *
 * module_items.data only ever mirrors the PUBLISHED asset; uploads in progress
 * live in video_assets. Students therefore keep watching the old video while a
 * replacement uploads and packages.
 */

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
export type VideoAssetRow = typeof videoAssetsTable.$inferSelect

// ── Liveness lease (Step 6) ──────────────────────────────────────────────────
// Mirrored in slo-admin/src/lib/video-lease.ts — keep the numbers in sync.
/** A multipart upload is "live" if its browser pinged within this window. */
export const HEARTBEAT_FRESH_MS = 2 * 60 * 1000
/** A single-PUT upload (< 100 MB) without heartbeats counts as live this long after it started. */
export const SINGLE_PUT_ACTIVE_MS = 10 * 60 * 1000
/** A packaging task is assumed alive this long (Step 3 normally reports a crash much sooner). */
export const PACKAGING_ACTIVE_MS = 90 * 60 * 1000

const ACTIVE: VideoAssetStatus[] = ["uploading", "packaging"]

export type Liveness = { live: boolean; reason: "heartbeat" | "single-put" | "packaging" | "stale" }

/** Is this active row really still being worked on (by another browser or by Fargate)? */
export function liveness(row: VideoAssetRow, now = Date.now()): Liveness {
  if (row.status === "packaging") {
    const since = (row.packagingAt ?? row.updatedAt ?? row.createdAt).getTime()
    return now - since < PACKAGING_ACTIVE_MS ? { live: true, reason: "packaging" } : { live: false, reason: "stale" }
  }
  if (row.status === "uploading") {
    if (row.lastHeartbeatAt && now - row.lastHeartbeatAt.getTime() < HEARTBEAT_FRESH_MS) {
      return { live: true, reason: "heartbeat" }
    }
    if (!row.uploadId && now - row.createdAt.getTime() < SINGLE_PUT_ACTIVE_MS) {
      return { live: true, reason: "single-put" }
    }
  }
  return { live: false, reason: "stale" }
}

/** What the admin UI needs to show about someone else's upload (no secrets in here). */
export function pendingInfo(row: VideoAssetRow) {
  const l = liveness(row)
  return {
    assetKey: row.assetKey,
    status: row.status,
    live: l.live,
    liveReason: l.reason,
    fileName: row.fileName,
    fileSize: row.fileSize,
    fingerprint: row.fingerprint,
    pct: row.pct,
    paused: row.paused,
    startedByName: row.startedByName,
    clientId: row.clientId,
    rawKey: row.rawKey,
    uploadId: row.uploadId,
    partSize: row.partSize,
    durationSec: row.durationSec,
    createdAt: row.createdAt.toISOString(),
    lastHeartbeatAt: row.lastHeartbeatAt?.toISOString() ?? null,
    packagingAt: row.packagingAt?.toISOString() ?? null,
  }
}

/** assetKey = courses/<courseId>/items/<itemId>/<uuid> */
export function itemIdOf(assetKey: string): number | null {
  const m = assetKey.match(/^courses\/\d+\/items\/(\d+)\/[0-9a-fA-F-]+$/)
  return m ? Number(m[1]) : null
}

// ── Locking + lookups ────────────────────────────────────────────────────────

/** Lock the module_items row for the rest of the transaction. Null if missing / not a video. */
export async function lockItem(tx: Tx, moduleItemId: number) {
  const [item] = await tx
    .select({ id: moduleItemsTable.id, type: moduleItemsTable.type, moduleId: moduleItemsTable.moduleId, data: moduleItemsTable.data })
    .from(moduleItemsTable)
    .where(eq(moduleItemsTable.id, moduleItemId))
    .for("update")
  if (!item || item.type !== "video") return null
  await ensureLegacyRow(tx, item)
  return item
}

/** The item's uploading|packaging row, if any (the partial unique index guarantees ≤ 1). */
export async function activeRow(tx: Tx, moduleItemId: number): Promise<VideoAssetRow | null> {
  const [row] = await tx
    .select()
    .from(videoAssetsTable)
    .where(and(eq(videoAssetsTable.moduleItemId, moduleItemId), inArray(videoAssetsTable.status, ACTIVE)))
    .limit(1)
  return row ?? null
}

/** The row for an assetKey, locked (lockItem must already hold the item lock). */
export async function rowForKey(tx: Tx, assetKey: string): Promise<VideoAssetRow | null> {
  const [row] = await tx.select().from(videoAssetsTable).where(eq(videoAssetsTable.assetKey, assetKey)).for("update")
  return row ?? null
}

/** The published assetKey of an item (data mirrors it), or null. */
export function publishedKeyOf(data: unknown): string | null {
  const d = data as VideoItemData | null
  if (!d || !("provider" in d) || d.provider !== "s3hls") return null
  return d.status === "ready" && d.assetKey ? d.assetKey : null
}

/**
 * Self-heal for uploads started before video_assets existed (or by an old app
 * instance during a deploy): the item's data points at an assetKey with no
 * row. Insert one so every later step finds it — as `uploading` with no
 * heartbeat (stale) if nothing else is active, else `discarded`.
 */
async function ensureLegacyRow(tx: Tx, item: { id: number; data: unknown }) {
  const d = item.data as VideoItemData | null
  if (!d || !("provider" in d) || d.provider !== "s3hls" || !d.assetKey) return
  const [existing] = await tx
    .select({ id: videoAssetsTable.id })
    .from(videoAssetsTable)
    .where(eq(videoAssetsTable.assetKey, d.assetKey))
  if (existing) return

  const status: VideoAssetStatus =
    d.status === "ready" ? "ready" : d.status === "failed" ? "failed" : (await activeRow(tx, item.id)) ? "discarded" : "uploading"
  await tx.insert(videoAssetsTable).values({
    moduleItemId: item.id,
    assetKey: d.assetKey,
    status,
    durationSec: d.durationSec ?? null,
    error: d.status === "failed" ? (d.error ?? null) : null,
    readyAt: status === "ready" ? new Date() : null,
    failedAt: status === "failed" ? new Date() : null,
  })
  console.warn("[video-assets] backfilled legacy row", { moduleItemId: item.id, assetKey: d.assetKey, status })
}

// ── Publishing ───────────────────────────────────────────────────────────────

/**
 * Make `row` the item's published video: point module_items.data at it and
 * mark the previously published row `superseded` (its files stay for rollback;
 * the reconciler deletes superseded assets after 7 days). Caller holds the lock.
 */
export async function publishRow(tx: Tx, item: { id: number; data: unknown }, row: VideoAssetRow, durationSec: number | null) {
  const prevKey = publishedKeyOf(item.data)
  const data: VideoItemData = {
    provider: "s3hls",
    assetKey: row.assetKey,
    status: "ready",
    ...(durationSec != null ? { durationSec } : {}),
  }
  await tx.update(moduleItemsTable).set({ data }).where(eq(moduleItemsTable.id, item.id))
  await tx
    .update(videoAssetsTable)
    .set({ status: "ready", updatedAt: new Date() })
    .where(eq(videoAssetsTable.id, row.id))
  if (prevKey && prevKey !== row.assetKey) {
    await tx
      .update(videoAssetsTable)
      .set({ status: "superseded", updatedAt: new Date() })
      .where(and(eq(videoAssetsTable.assetKey, prevKey), eq(videoAssetsTable.status, "ready")))
  }
  return prevKey
}

/**
 * Should a row that just finished packaging be published? Only if it was the
 * item's current upload (not discarded) and nothing newer has been uploaded
 * since — a late success of an old failed upload must not override a newer one.
 */
export async function shouldAutoPublish(tx: Tx, row: VideoAssetRow): Promise<boolean> {
  if (row.status === "discarded" || row.status === "superseded" || row.status === "ready") return false
  const [newer] = await tx
    .select({ id: videoAssetsTable.id })
    .from(videoAssetsTable)
    .where(
      and(
        eq(videoAssetsTable.moduleItemId, row.moduleItemId),
        gt(videoAssetsTable.id, row.id),
        inArray(videoAssetsTable.status, ["uploading", "packaging", "ready", "superseded"])
      )
    )
    .orderBy(desc(videoAssetsTable.id))
    .limit(1)
  return !newer
}

/** Postgres unique violation (e.g. video_assets_one_active), through Drizzle's error wrapper. */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null
  return e?.code === "23505" || e?.cause?.code === "23505"
}
