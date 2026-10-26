import { timingSafeEqual } from "crypto"

/**
 * Shared-secret auth for the video ingest endpoints (see
 * docs/video-drm-streaming.md). The external admin platform sends
 * `Authorization: Bearer <VIDEO_INGEST_SECRET>`. Server-to-server only — no
 * Clerk/user session is involved. Comparison is constant-time.
 */
export function verifyIngestSecret(req: Request): boolean {
  const secret = process.env.VIDEO_INGEST_SECRET
  if (!secret) return false
  const header = req.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  const a = Buffer.from(token)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
