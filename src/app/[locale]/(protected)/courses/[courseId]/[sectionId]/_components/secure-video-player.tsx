"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js"
import { useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { saveVideoPosition } from "@/actions/progress-actions"

/**
 * Rung-3 encrypted-HLS player.
 * Streams `/api/video/[itemId]/master.m3u8` via hls.js (native HLS on Safari).
 * The manifest + AES key are same-origin, so the Clerk session cookie rides along
 * automatically and the server re-checks enrollment on every request; the
 * encrypted segments come from short-lived presigned S3 URLs. No plain source
 * URL ever exists in the DOM.
 *
 * Also owns progress: resume from `lastPositionSec`, throttled position
 * saves, and a one-shot auto-complete at 85% / on `ended`.
 */

const SAVE_EVERY_SEC = 10
const COMPLETE_AT = 0.85

function SecureVideoPlayer({
  itemId,
  lastPositionSec,
  className,
}: {
  itemId: number
  lastPositionSec: number | null
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSavedRef = useRef(0)
  const completedRef = useRef(false)
  const { user } = useUser()
  const watermark = user?.primaryEmailAddress?.emailAddress ?? user?.id ?? null

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const src = `/api/video/${itemId}/master.m3u8`

    let hls: Hls | null = null
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false })
      hls.loadSource(src)
      hls.attachMedia(video)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari / iOS: native HLS. Key + manifest requests carry cookies.
      video.src = src
    }

    return () => {
      hls?.destroy()
    }
  }, [itemId])

  function onLoadedMetadata() {
    const video = videoRef.current
    if (!video) return
    // Resume, but don't drop the viewer right at the end of a finished video.
    if (lastPositionSec && lastPositionSec < video.duration * 0.98) {
      video.currentTime = lastPositionSec
    }
  }

  function onTimeUpdate() {
    const video = videoRef.current
    if (!video || !video.duration) return
    const t = video.currentTime

    // One-shot completion at 85% (or on `ended`, below).
    if (!completedRef.current && t / video.duration >= COMPLETE_AT) {
      completedRef.current = true
      lastSavedRef.current = t
      void saveVideoPosition(itemId, t, true).catch(() => {})
      return
    }

    // Throttled resume-position save.
    if (t - lastSavedRef.current >= SAVE_EVERY_SEC) {
      lastSavedRef.current = t
      void saveVideoPosition(itemId, t).catch(() => {})
    }
  }

  function onEnded() {
    const video = videoRef.current
    if (!video || completedRef.current) return
    completedRef.current = true
    void saveVideoPosition(itemId, video.currentTime || 0, true).catch(() => {})
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-black", className)}>
      <video
        ref={videoRef}
        controls
        playsInline
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        controlsList="nodownload"
        disablePictureInPicture
        className="h-full w-full object-contain"
      />
      {watermark && (
        <span className="pointer-events-none absolute bottom-2 right-3 select-none text-[10px] font-medium text-white/40 mix-blend-difference">
          {watermark}
        </span>
      )}
    </div>
  )
}

export default SecureVideoPlayer
