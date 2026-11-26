import { NextResponse } from "next/server"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, type VideoItemData } from "@/db/schema"
import { abortMultipartUploadsUnder } from "@/lib/s3"

/**
 * Guard for the two "start an upload" routes (/api/video/ingest and
 * /api/video/ingest/multipart/create).
 *
 * Each start mints a fresh assetKey and overwrites the item's `data`. If an
 * earlier upload for the same item is still in flight (a multi-hour upload of a
 * large master from another tab/device, or one already packaging), that earlier
 * upload later completes and gets packaged — but its callback is rejected
 * because the DB now holds the newer key, so the item is stuck "processing"
 * forever. (Incident 2026-11-25: items 1, 10, 23.)
 *
 * So:
 *   1. refuse to start over an in-flight upload unless the caller explicitly
 *      asks to replace it (and, if it says which upload it saw, only that one);
 *   2. write the new state with a compare-and-swap (`casItemData`) so two
 *      concurrent starts can't both win between the read and the write;
 *   3. once the write has won, abort the superseded multipart upload so it can
 *      never complete.
 */

/** The assetKey of an upload still in flight for this item, if any. `failed` is not in flight. */
export function inFlightAssetKey(data: unknown): string | null {
  const d = data as VideoItemData | null | undefined
  if (!d || !("provider" in d) || d.provider !== "s3hls") return null
  if (d.status !== "processing" || !d.assetKey) return null
  return d.assetKey
}

/**
 * Returns a 409 response if starting a new upload isn't allowed, else null.
 *
 * - Nothing in flight → allowed.
 * - In flight, no `replace` → 409 UPLOAD_IN_PROGRESS.
 * - In flight, `replace`, and `expectedAssetKey` (the key the admin saw when it
 *   confirmed the "discard it" dialog) differs from what's in flight now →
 *   409 UPLOAD_CHANGED: a *different* upload started after the dialog, and the
 *   admin never agreed to discard that one.
 */
export function checkStartAllowed(
  tag: string,
  moduleItemId: number,
  data: unknown,
  opts: { replace: boolean; expectedAssetKey: string | null }
): NextResponse | null {
  const existing = inFlightAssetKey(data)
  if (!existing) return null

  if (!opts.replace) {
    console.warn(`[${tag}] 409 — upload already in progress`, { moduleItemId, existing })
    return NextResponse.json(
      {
        error: "An upload for this video is already in progress. Pass replace: true to discard it.",
        code: "UPLOAD_IN_PROGRESS",
        assetKey: existing,
      },
      { status: 409 }
    )
  }

  if (opts.expectedAssetKey && opts.expectedAssetKey !== existing) {
    console.warn(`[${tag}] 409 — in-flight upload changed since the replace was confirmed`, {
      moduleItemId,
      existing,
      expectedAssetKey: opts.expectedAssetKey,
    })
    return conflictChanged(existing)
  }
  return null
}

/** 409 for "the item changed under you" (concurrent start / changed in-flight upload). */
export function conflictChanged(assetKey: string | null): NextResponse {
  return NextResponse.json(
    {
      error: "Another upload for this video was started in the meantime. Reload and try again.",
      code: "UPLOAD_CHANGED",
      assetKey,
    },
    { status: 409 }
  )
}

/**
 * Compare-and-swap on a video item's `data`: write `next` only if the row still
 * holds exactly `prev` (jsonb equality is semantic, so key order doesn't
 * matter). Returns false if someone else changed the row since it was read.
 */
export async function casItemData(moduleItemId: number, prev: unknown, next: VideoItemData): Promise<boolean> {
  const updated = await db
    .update(moduleItemsTable)
    .set({ data: next })
    .where(
      and(
        eq(moduleItemsTable.id, moduleItemId),
        eq(moduleItemsTable.type, "video"),
        sql`${moduleItemsTable.data} = ${JSON.stringify(prev ?? null)}::jsonb`
      )
    )
    .returning({ id: moduleItemsTable.id })
  return updated.length > 0
}

/**
 * Best-effort: abort every multipart upload of a superseded asset so it can
 * never complete and get packaged. Needs s3:ListBucketMultipartUploads.
 */
export async function abortSuperseded(tag: string, moduleItemId: number, supersededKey: string): Promise<void> {
  try {
    const aborted = await abortMultipartUploadsUnder(`raw/${supersededKey}/`)
    console.log(`[${tag}] replaced in-flight upload`, { moduleItemId, supersededKey, aborted })
  } catch (err) {
    // Not fatal: multipart/complete refuses to assemble an upload whose
    // assetKey the item no longer holds, so a superseded upload can't win.
    console.warn(`[${tag}] could not abort superseded multipart upload(s)`, {
      moduleItemId,
      supersededKey,
      msg: err instanceof Error ? err.message : String(err),
    })
  }
}

/** Parse the optional `expectedAssetKey` from a request body. */
export function parseExpectedAssetKey(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null
}
