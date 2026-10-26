import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, modulesTable, type VideoItemData } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
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
    return NextResponse.json({ error: "moduleItemId and a valid ext are required" }, { status: 400 })
  }

  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, moduleItemId),
    columns: { id: true, type: true, moduleId: true },
  })
  if (!item || item.type !== "video") {
    return NextResponse.json({ error: "Video module item not found" }, { status: 404 })
  }

  const mod = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.id, item.moduleId),
    columns: { courseId: true },
  })
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 })

  const assetKey = `courses/${mod.courseId}/items/${moduleItemId}/${randomUUID()}`
  const data: VideoItemData = { provider: "s3hls", assetKey, status: "processing" }
  await db.update(moduleItemsTable).set({ data }).where(eq(moduleItemsTable.id, moduleItemId))

  const uploadUrl = await presignPut(`raw/${assetKey}/master.${ext}`, contentType, 3600)
  return NextResponse.json({ assetKey, uploadUrl, expiresInSec: 3600 })
}
