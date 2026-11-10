import { NextRequest, NextResponse } from "next/server"
import { resolveItemAccess } from "@/actions/course-actions"
import { presignGet } from "@/lib/s3"

/**
 * Auth-gated serving for an uploaded (`provider: "s3"`) PDF module item:
 *
 *   GET /api/pdf/[itemId]   the PDF bytes, streamed inline
 *
 * Every request re-checks enrollment via resolveItemAccess — this route is the
 * real gate; UI gating is convenience only. The file lives in the PRIVATE
 * bucket and is never a plain URL in the DOM: we presign a short-lived GET
 * server-side and pipe the bytes through with inline, no-store headers (no
 * Content-Disposition: attachment, so browsers won't offer a "Save as"). No
 * per-viewer watermark yet (see docs/future-asset-security.md).
 */

const noStore = {
  "Cache-Control": "private, no-store, max-age=0",
} as const

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ itemId: string }> }
) {
  const { itemId: itemIdRaw } = await ctx.params
  const itemId = Number(itemIdRaw)
  if (!Number.isInteger(itemId)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const access = await resolveItemAccess(itemId)
  if (access.state === "notfound") return new NextResponse("Not found", { status: 404 })
  if (access.state === "locked") return new NextResponse("Forbidden", { status: 403 })

  // This route only serves uploaded (s3) PDFs; legacy `assetId`-only rows 404.
  if (access.type !== "pdf" || !("provider" in access.data) || access.data.provider !== "s3") {
    return new NextResponse("Not found", { status: 404 })
  }
  if (access.data.status !== "ready") {
    return new NextResponse("PDF is still processing", { status: 409, headers: noStore })
  }

  try {
    const url = await presignGet(`pdf/${access.data.assetKey}.pdf`)
    const upstream = await fetch(url, { cache: "no-store" })
    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Not found", { status: 404 })
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        ...noStore,
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
