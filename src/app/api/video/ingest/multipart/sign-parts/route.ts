import { NextResponse } from "next/server"
import { verifyIngestSecret } from "@/lib/ingest-auth"
import { presignUploadPart } from "@/lib/s3"
import { parseRawKey } from "@/lib/ingest-multipart"

/**
 * Video ingest (multipart), step 2 — presigned UploadPart PUT URLs for a batch
 * of part numbers. Called repeatedly: the browser signs parts in batches as it
 * uploads, and re-signs the remaining parts on resume (presigned URLs carry a
 * TTL, so a long upload or a long pause outlives the first batch).
 *
 * Auth: shared secret (Bearer VIDEO_INGEST_SECRET).
 */

const PART_TTL_SEC = 3600
const MAX_PARTS_PER_CALL = 1000

export async function POST(req: Request) {
  if (!verifyIngestSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { rawKey?: unknown; uploadId?: unknown; partNumbers?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = parseRawKey(body.rawKey)
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : ""
  const partNumbers = Array.isArray(body.partNumbers) ? body.partNumbers : null
  if (!parsed || !uploadId || !partNumbers) {
    return NextResponse.json(
      { error: "rawKey, uploadId and partNumbers are required" },
      { status: 400 }
    )
  }
  if (partNumbers.length === 0 || partNumbers.length > MAX_PARTS_PER_CALL) {
    return NextResponse.json(
      { error: `partNumbers must contain 1..${MAX_PARTS_PER_CALL} entries` },
      { status: 400 }
    )
  }

  const nums: number[] = []
  for (const n of partNumbers) {
    const pn = Number(n)
    if (!Number.isInteger(pn) || pn < 1 || pn > 10000) {
      return NextResponse.json({ error: `invalid part number: ${String(n)}` }, { status: 400 })
    }
    nums.push(pn)
  }

  const rawKey = body.rawKey as string
  const urls = await Promise.all(
    nums.map(async (partNumber) => ({
      partNumber,
      url: await presignUploadPart(rawKey, uploadId, partNumber, PART_TTL_SEC),
    }))
  )

  console.log("[video-ingest-mpu:sign-parts] 200 — signed parts", {
    rawKey,
    uploadId,
    count: urls.length,
    first: nums[0],
    last: nums[nums.length - 1],
  })

  return NextResponse.json({ urls, expiresInSec: PART_TTL_SEC })
}
