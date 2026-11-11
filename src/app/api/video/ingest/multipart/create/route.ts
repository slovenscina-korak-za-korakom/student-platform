import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, modulesTable, type VideoItemData } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { createMultipartUpload } from "@/lib/s3"

/**
 * Video ingest (multipart), step 1 — large-file sibling of /api/video/ingest.
 * Mints an `assetKey`, marks the owning item `processing`, opens an S3 multipart
 * upload for the raw master, and returns { assetKey, rawKey, uploadId }. The
 * admin browser then uploads parts via presigned PUTs (see ./sign-parts) and
 * calls ./complete; assembling the object fires the same S3 ObjectCreated event
 * that triggers packaging, so everything downstream is unchanged.
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET). No user session.
 */

const SAFE_EXT = /^[a-z0-9]{2,5}$/i

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    console.warn("[video-ingest-mpu:create] 401 — missing/invalid VIDEO_INGEST_SECRET")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { moduleItemId?: unknown; ext?: unknown; contentType?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const moduleItemId = Number(body.moduleItemId)
  const ext = String(body.ext ?? "").toLowerCase()
  const contentType = String(body.contentType ?? "application/octet-stream")
  if (!Number.isInteger(moduleItemId) || !SAFE_EXT.test(ext)) {
    console.warn("[video-ingest-mpu:create] 400 — bad moduleItemId/ext", { moduleItemId, ext })
    return NextResponse.json({ error: "moduleItemId and a valid ext are required" }, { status: 400 })
  }

  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, moduleItemId),
    columns: { id: true, type: true, moduleId: true },
  })
  if (!item || item.type !== "video") {
    console.warn("[video-ingest-mpu:create] 404 — video module item not found", { moduleItemId })
    return NextResponse.json({ error: "Video module item not found" }, { status: 404 })
  }

  const mod = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.id, item.moduleId),
    columns: { courseId: true },
  })
  if (!mod) {
    console.warn("[video-ingest-mpu:create] 404 — module not found", { moduleId: item.moduleId })
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const assetKey = `courses/${mod.courseId}/items/${moduleItemId}/${randomUUID()}`
  const data: VideoItemData = { provider: "s3hls", assetKey, status: "processing" }
  await db.update(moduleItemsTable).set({ data }).where(eq(moduleItemsTable.id, moduleItemId))

  const rawKey = `raw/${assetKey}/master.${ext}`
  const uploadId = await createMultipartUpload(rawKey, contentType)

  console.log("[video-ingest-mpu:create] 200 — multipart opened", {
    moduleItemId,
    assetKey,
    rawKey,
    contentType,
    uploadId,
    envBucket: process.env.S3_VIDEO_BUCKET,
    envRegion: process.env.AWS_REGION,
  })

  return NextResponse.json({ assetKey, rawKey, uploadId })
}
