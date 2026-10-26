import { cn } from "@/lib/utils"

/**
 * Simple player in a letterboxed, rounded frame. Server-safe.
 * Used for YouTube / public `url` videos only (privacy-friendly embed; the
 * native <video> is a last-resort fallback for a non-YouTube plain URL).
 *
 * Protected course videos (`provider: "s3hls"`) do NOT use this — they render
 * via `SecureVideoPlayer` (Rung-3 encrypted HLS), which also owns
 * resume-from-lastPositionSec and auto-complete at 85%. See
 * docs/video-drm-streaming.md and `module-content.tsx`'s `ModuleVideo`.
 */
function VideoFrame({ url, className }: { url: string; className?: string }) {
  const embed = youtubeEmbed(url)
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-black", className)}>
      {embed ? (
        <iframe
          src={embed}
          title="Video"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video controls playsInline src={url} className="h-full w-full object-contain" />
      )}
    </div>
  )
}

/** Normalize a YouTube watch/short/share/embed URL to its embed form, else null. */
function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\.|^m\./, "")
    if (host === "youtu.be") {
      const id = u.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v")
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
      if (u.pathname.startsWith("/embed/")) return url
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2]
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
    }
    return null
  } catch {
    return null
  }
}

export default VideoFrame
