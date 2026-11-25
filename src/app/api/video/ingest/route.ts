import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, modulesTable, type VideoItemData } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { guardInFlightUpload } from "@/lib/video-ingest-guard"
import { presignPut } from "@/lib/s3"

/**
 * Video ingest, step 1. The admin platform
 * POSTs metadata for an existing `video` module item; we mint an `assetKey`,
 * mark the item `processing`, and return a short-lived presigned S3 PUT for the
 * raw master. The admin platform then PUTs the file straight to S3 (keeps large
 * uploads off this serverless route); the S3 ObjectCreated event triggers the
 * packaging worker, which later calls /api/video/ingest/complete.
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET). No user session.
 */

const SAFE_EXT = /^[a-z0-9]{2,5}$/i

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    console.warn("[video-ingest] 401 — missing/invalid VIDEO_INGEST_SECRET")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { moduleItemId?: unknown; ext?: unknown; contentType?: unknown; replace?: unknown }
  try {
    body = await req.json()
  } catch {
    console.warn("[video-ingest] 400 — invalid JSON body")
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const moduleItemId = Number(body.moduleItemId)
  const ext = String(body.ext ?? "").toLowerCase()
  const contentType = String(body.contentType ?? "application/octet-stream")
  console.log("[video-ingest] request", { moduleItemId, ext, contentType })
  if (!Number.isInteger(moduleItemId) || !SAFE_EXT.test(ext)) {
    console.warn("[video-ingest] 400 — bad moduleItemId/ext", { moduleItemId, ext })
    return NextResponse.json({ error: "moduleItemId and a valid ext are required" }, { status: 400 })
  }

  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, moduleItemId),
    columns: { id: true, type: true, moduleId: true, data: true },
  })
  if (!item || item.type !== "video") {
    console.warn("[video-ingest] 404 — video module item not found", { moduleItemId, found: !!item, type: item?.type })
    return NextResponse.json({ error: "Video module item not found" }, { status: 404 })
  }

  // Don't silently orphan an upload that's still in flight (see video-ingest-guard).
  const conflict = await guardInFlightUpload("video-ingest", moduleItemId, item.data, body.replace === true)
  if (conflict) return conflict

  const mod = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.id, item.moduleId),
    columns: { courseId: true },
  })
  if (!mod) {
    console.warn("[video-ingest] 404 — module not found", { moduleId: item.moduleId })
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const assetKey = `courses/${mod.courseId}/items/${moduleItemId}/${randomUUID()}`
  const data: VideoItemData = { provider: "s3hls", assetKey, status: "processing" }
  await db.update(moduleItemsTable).set({ data }).where(eq(moduleItemsTable.id, moduleItemId))

  const rawKey = `raw/${assetKey}/master.${ext}`
  const uploadUrl = await presignPut(rawKey, contentType, 3600)

  // Diagnostic: the host/bucket/region the browser will PUT to is what CORS and
  // the "network error" hinge on. Logs the target without assuming it matches env.
  let uploadHost = ""
  let uploadPath = ""
  try {
    const u = new URL(uploadUrl)
    uploadHost = u.host
    uploadPath = u.pathname
  } catch {}
  console.log("[video-ingest] 200 — presigned PUT", {
    moduleItemId,
    assetKey,
    rawKey,
    contentType,
    envBucket: process.env.S3_VIDEO_BUCKET,
    envRegion: process.env.AWS_REGION,
    uploadHost,
    uploadPath,
    uploadUrl,
  })

  return NextResponse.json({ assetKey, uploadUrl, expiresInSec: 3600 })
}
