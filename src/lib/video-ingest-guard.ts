import { NextResponse } from "next/server"
import type { VideoItemData } from "@/db/schema"
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
 * So: refuse to start over an in-flight upload unless the caller explicitly
 * asks to replace it, and when replacing, abort the superseded multipart upload
 * so it can never complete.
 */

/** The assetKey of an upload still in flight for this item, if any. */
export function inFlightAssetKey(data: unknown): string | null {
  const d = data as VideoItemData | null | undefined
  if (!d || !("provider" in d) || d.provider !== "s3hls") return null
  if (d.status !== "processing" || !d.assetKey) return null
  return d.assetKey
}

/**
 * Returns a 409 response if an upload is in flight and `replace` wasn't set.
 * If `replace` is set, best-effort aborts the superseded multipart upload(s) and
 * returns null so the caller proceeds.
 */
export async function guardInFlightUpload(
  tag: string,
  moduleItemId: number,
  data: unknown,
  replace: boolean
): Promise<NextResponse | null> {
  const existing = inFlightAssetKey(data)
  if (!existing) return null

  if (!replace) {
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

  try {
    const aborted = await abortMultipartUploadsUnder(`raw/${existing}/`)
    console.log(`[${tag}] replacing in-flight upload`, { moduleItemId, existing, aborted })
  } catch (err) {
    // Missing s3:ListBucketMultipartUploads, etc. Not fatal: the claim in
    // multipart/complete still keeps the DB consistent with what gets packaged.
    console.warn(`[${tag}] could not abort superseded multipart upload(s)`, {
      moduleItemId,
      existing,
      msg: err instanceof Error ? err.message : String(err),
    })
  }
  return null
}
