/**
 * Shared validation for the multipart video-ingest routes. The admin browser
 * drives a resumable multipart upload of the raw master; these routes are the
 * signing authority. A `rawKey` and `uploadId` arrive from the caller, so we
 * validate the key shape before touching S3 — it must be a raw-master key this
 * pipeline itself mints, not an arbitrary object.
 *
 *   rawKey   = raw/<assetKey>/master.<ext>
 *   assetKey = courses/<courseId>/items/<itemId>/<uuid>
 */

const RAW_KEY_RE =
  /^raw\/(courses\/\d+\/items\/(\d+)\/[0-9a-fA-F-]+)\/master\.[a-z0-9]{2,5}$/

export type ParsedRawKey = { assetKey: string; moduleItemId: number }

/** Parse + validate a raw-master key; returns null if it isn't one we mint. */
export function parseRawKey(rawKey: unknown): ParsedRawKey | null {
  if (typeof rawKey !== "string") return null
  const m = rawKey.match(RAW_KEY_RE)
  if (!m) return null
  const moduleItemId = Number(m[2])
  if (!Number.isInteger(moduleItemId)) return null
  return { assetKey: m[1], moduleItemId }
}
