import { timingSafeEqual } from "crypto"

/**
 * Shared-secret auth for the video ingest endpoints (see
 * docs/video-drm-streaming.md). The external admin platform sends
 * `Authorization: Bearer <VIDEO_INGEST_SECRET>`. Server-to-server only — no
 * Clerk/user session is involved. Comparison is constant-time.
 */
export function verifyIngestSecret(req: Request): boolean {
  const secret = process.env.VIDEO_INGEST_SECRET
  const header = req.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  // Diagnostic only — logs presence + lengths, never the secret/token values.
  // A secretLen/tokenLen mismatch of 1 is almost always a trailing newline; a
  // missing secret means the deployment hasn't picked up the env var (redeploy).
  console.warn("[ingest-auth] check", {
    secretPresent: !!secret,
    secretLen: secret?.length ?? 0,
    tokenLen: token.length,
    hasBearer: header.startsWith("Bearer "),
  })
  if (!secret) return false
  const a = Buffer.from(token)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
