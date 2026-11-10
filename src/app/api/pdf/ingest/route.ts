import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { moduleItemsTable, modulesTable, type PdfItemData } from "@/db/schema"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { presignPut } from "@/lib/s3"

/**
 * PDF ingest. The admin platform POSTs metadata for an existing `pdf` module
 * item; we mint an `assetKey`, mark the item `processing`, and return a
 * short-lived presigned S3 PUT. The admin PUTs the file straight to the private
 * bucket (same one the video pipeline uses), then flips the item to `ready`
 * directly in the shared DB — PDFs need no packaging, so there is no async
 * worker and no `complete` callback.
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET). No user session.
 */

const SAFE_EXT = /^[a-z0-9]{2,5}$/i

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    console.warn("[pdf-ingest] 401 — missing/invalid VIDEO_INGEST_SECRET")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { moduleItemId?: unknown; ext?: unknown; contentType?: unknown }
  try {
    body = await req.json()
  } catch {
    console.warn("[pdf-ingest] 400 — invalid JSON body")
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const moduleItemId = Number(body.moduleItemId)
  const ext = String(body.ext ?? "").toLowerCase()
  const contentType = String(body.contentType ?? "application/pdf")
  console.log("[pdf-ingest] request", { moduleItemId, ext, contentType })
  if (!Number.isInteger(moduleItemId) || !SAFE_EXT.test(ext)) {
    console.warn("[pdf-ingest] 400 — bad moduleItemId/ext", { moduleItemId, ext })
    return NextResponse.json({ error: "moduleItemId and a valid ext are required" }, { status: 400 })
  }

  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, moduleItemId),
    columns: { id: true, type: true, moduleId: true },
  })
  if (!item || item.type !== "pdf") {
    console.warn("[pdf-ingest] 404 — pdf module item not found", { moduleItemId, found: !!item, type: item?.type })
    return NextResponse.json({ error: "PDF module item not found" }, { status: 404 })
  }

  const mod = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.id, item.moduleId),
    columns: { courseId: true },
  })
  if (!mod) {
    console.warn("[pdf-ingest] 404 — module not found", { moduleId: item.moduleId })
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const assetKey = `courses/${mod.courseId}/items/${moduleItemId}/${randomUUID()}`
  const data: PdfItemData = { provider: "s3", assetKey, status: "processing" }
  await db.update(moduleItemsTable).set({ data }).where(eq(moduleItemsTable.id, moduleItemId))

  // Canonical object path — PDFs are always stored as `.pdf`, so the serving
  // route (`/api/pdf/[itemId]`) can resolve it from the assetKey alone.
  const objectKey = `pdf/${assetKey}.pdf`
  const uploadUrl = await presignPut(objectKey, contentType, 3600)

  // Diagnostic: the host/bucket/region the browser PUTs to is what CORS and the
  // "network error" hinge on. Logs the target without assuming it matches env.
  let uploadHost = ""
  let uploadPath = ""
  try {
    const u = new URL(uploadUrl)
    uploadHost = u.host
    uploadPath = u.pathname
  } catch {}
  console.log("[pdf-ingest] 200 — presigned PUT", {
    moduleItemId,
    assetKey,
    objectKey,
    contentType,
    envBucket: process.env.S3_VIDEO_BUCKET,
    envRegion: process.env.AWS_REGION,
    uploadHost,
    uploadPath,
  })

  return NextResponse.json({ assetKey, uploadUrl, expiresInSec: 3600 })
}
