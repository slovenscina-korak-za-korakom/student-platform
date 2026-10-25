import { cn } from "@/lib/utils"

/**
 * Simple player in a letterboxed, rounded frame. Server-safe.
 * YouTube links play via the privacy-friendly embed; anything else falls back
 * to a native <video>.
 *
 * TODO: this is the interim player. Replace with a DRM-protected adaptive
 * stream (signed manifests, no downloadable source) — see
 * docs/video-drm-streaming.md for the plan, decisions, and provider options.
 * That work also enables resume-from-lastPositionSec and auto-complete at 85%
 * (deferred to the DRM player; see the D7 note in that doc for why).
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
