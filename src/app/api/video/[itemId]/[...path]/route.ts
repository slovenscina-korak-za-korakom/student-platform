import { NextRequest, NextResponse } from "next/server"
import { resolveItemAccess } from "@/actions/course-actions"
import { getObject, getText, presignGet } from "@/lib/s3"

/**
 * Rung-3 encrypted-HLS serving. One gated
 * origin for everything the player fetches from our domain:
 *
 *   GET /api/video/[itemId]/master.m3u8    top-level playlist (passthrough)
 *   GET /api/video/[itemId]/stream_N.m3u8  media playlist (segment URIs → presigned S3)
 *   GET /api/video/[itemId]/key            the 16-byte AES-128 key
 *
 * Every request re-checks enrollment via resolveItemAccess — the key route is
 * the real gate. Playlists and the key are relayed from a PRIVATE bucket; only
 * the encrypted .ts segments are handed out as short-lived presigned URLs.
 * Nothing playable or downloadable is ever a plain URL in the DOM.
 */

// Only flat, safe names: `key`, or `<name>.m3u8`. Blocks path traversal.
const SAFE_NAME = /^[\w-]+\.m3u8$/

const noStore = {
  "Cache-Control": "no-store, max-age=0",
} as const

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ itemId: string; path: string[] }> }
) {
  const { itemId: itemIdRaw, path } = await ctx.params
  const itemId = Number(itemIdRaw)
  if (!Number.isInteger(itemId) || path.length !== 1) {
    return new NextResponse("Not found", { status: 404 })
  }
  const name = path[0]
  const wantsKey = name === "key"
  if (!wantsKey && !SAFE_NAME.test(name)) {
    return new NextResponse("Not found", { status: 404 })
  }

  const access = await resolveItemAccess(itemId)
  if (access.state === "notfound") return new NextResponse("Not found", { status: 404 })
  if (access.state === "locked") return new NextResponse("Forbidden", { status: 403 })

  // This route only serves Rung-3 S3 assets; anything else (youtube) 404s here.
  if (access.type !== "video" || !("provider" in access.data) || access.data.provider !== "s3hls") {
    return new NextResponse("Not found", { status: 404 })
  }
  const assetKey = access.data.assetKey
  if (access.data.status !== "ready") {
    return new NextResponse("Video is still processing", { status: 409, headers: noStore })
  }

  try {
    if (wantsKey) {
      const key = await getObject(`keys/${assetKey}.key`)
      return new NextResponse(key, {
        status: 200,
        headers: { ...noStore, "Content-Type": "application/octet-stream" },
      })
    }

    const playlist = await getText(`hls/${assetKey}/${name}`)
    const rewritten = await rewritePlaylist(playlist, assetKey)
    return new NextResponse(rewritten, {
      status: 200,
      headers: { ...noStore, "Content-Type": "application/vnd.apple.mpegurl" },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}

/**
 * Rewrite an HLS playlist for presigned delivery:
 * - comment/tag lines (`#…`) and blanks pass through — this keeps the
 *   `#EXT-X-KEY:...,URI="key"` line intact, whose relative `key` resolves to our
 *   /api/video/[itemId]/key route;
 * - a `.m3u8` URI (variant playlist, master only) stays relative → it resolves
 *   back to this route, so its segments get presigned on their own request;
 * - anything else is a segment filename → swapped for a short-lived presigned
 *   S3 GET URL.
 */
async function rewritePlaylist(text: string, assetKey: string): Promise<string> {
  const lines = text.split(/\r?\n/)
  const out = await Promise.all(
    lines.map(async (line) => {
      const trimmed = line.trim()
      if (trimmed === "" || trimmed.startsWith("#")) return line
      if (trimmed.endsWith(".m3u8")) return line
      return presignGet(`hls/${assetKey}/${trimmed}`)
    })
  )
  return out.join("\n")
}
