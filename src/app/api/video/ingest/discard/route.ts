import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { videoAssetsTable } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { abortMultipartUpload, abortMultipartUploadsUnder } from "@/lib/s3"
import { itemIdOf, liveness, lockItem, pendingInfo, rowForKey } from "@/lib/video-assets"

/**
 * Discard an upload — the admin canceled its own upload, or gave up on an
 * interrupted one. Marks the row `discarded` (if uploading / packaging /
 * failed) and aborts its multipart upload so it can never complete. A task
 * that is already packaging keeps running; its result lands as an unpublished
 * version. The published video is untouched. Idempotent. Auth: shared secret.
 *
 * `onlyIfStale: true` (discarding someone else's upload from another device):
 * refused with 423 UPLOAD_ACTIVE while that upload is still live (Step 6).
 */

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { assetKey?: unknown; onlyIfStale?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const assetKey = typeof body.assetKey === "string" ? body.assetKey : ""
  const itemId = itemIdOf(assetKey)
  if (itemId == null) return NextResponse.json({ error: "Valid assetKey is required" }, { status: 400 })

  const onlyIfStale = body.onlyIfStale === true
  let liveRefusal: NextResponse | null = null
  const row = await db.transaction(async (tx) => {
    if (!(await lockItem(tx, itemId))) return null
    const r = await rowForKey(tx, assetKey)
    if (!r || !["uploading", "packaging", "failed"].includes(r.status)) return r
    if (onlyIfStale && liveness(r).live) {
      liveRefusal = NextResponse.json(
        { error: "This upload is still active and can't be discarded.", code: "UPLOAD_ACTIVE", pending: pendingInfo(r) },
        { status: 423 }
      )
      return r
    }
    await tx
      .update(videoAssetsTable)
      .set({ status: "discarded", error: "discarded by admin", updatedAt: new Date() })
      .where(eq(videoAssetsTable.id, r.id))
    return { ...r, status: "discarded" as const }
  })
  if (liveRefusal) return liveRefusal
  if (!row) return NextResponse.json({ error: "Unknown upload" }, { status: 404 })

  try {
    if (row.rawKey && row.uploadId) await abortMultipartUpload(row.rawKey, row.uploadId)
    else await abortMultipartUploadsUnder(`raw/${assetKey}/`)
  } catch (err) {
    console.warn("[video-discard] abort failed (ignoring)", { assetKey, msg: err instanceof Error ? err.message : String(err) })
  }
  console.log("[video-discard] 200", { assetKey, status: row.status })
  return NextResponse.json({ ok: true, status: row.status })
}
