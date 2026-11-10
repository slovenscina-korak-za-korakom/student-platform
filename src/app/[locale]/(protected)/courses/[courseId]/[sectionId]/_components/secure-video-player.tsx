"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Hls, { type Level } from "hls.js"
import { useUser } from "@clerk/nextjs"
import {
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconMinimize,
  IconSettings,
  IconRewindBackward10,
  IconRewindForward10,
  IconPictureInPicture,
  IconLoader2,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { saveVideoPosition } from "@/actions/progress-actions"

/**
 * Rung-3 encrypted-HLS player with a bespoke, Netflix-style control layer.
 *
 * Streams `/api/video/[itemId]/master.m3u8` via hls.js (native HLS on Safari).
 * The manifest + AES key are same-origin, so the Clerk session cookie rides along
 * automatically and the server re-checks enrollment on every request; the
 * encrypted segments come from short-lived presigned S3 URLs. No plain source
 * URL ever exists in the DOM.
 *
 * Owns progress: resume from `lastPositionSec`, throttled position saves, and a
 * one-shot auto-complete at 85% / on `ended`.
 *
 * The native `controls` attribute is intentionally omitted — every control
 * (scrub bar, volume, speed, quality, PiP, fullscreen, keyboard shortcuts) is
 * rendered here so the UI stays on-brand and consistent across browsers.
 */

const SAVE_EVERY_SEC = 10
const COMPLETE_AT = 0.85
const SKIP_SEC = 10
const CONTROLS_HIDE_MS = 2600
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

type SettingsPage = "main" | "speed" | "quality"

function SecureVideoPlayer({
  itemId,
  lastPositionSec,
  title,
  className,
}: {
  itemId: number
  lastPositionSec: number | null
  title?: string | null
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const lastSavedRef = useRef(0)
  const completedRef = useRef(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { user } = useUser()
  const watermark = user?.primaryEmailAddress?.emailAddress ?? user?.id ?? null

  // Playback state
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)

  // Quality (HLS levels). `levelIdx === -1` means auto/adaptive.
  const [levels, setLevels] = useState<Level[]>([])
  const [levelIdx, setLevelIdx] = useState(-1)
  const [activeLevel, setActiveLevel] = useState(-1)

  // Chrome state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPip, setIsPip] = useState(false)
  const [pipSupported, setPipSupported] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsPage, setSettingsPage] = useState<SettingsPage>("main")
  const [scrubHover, setScrubHover] = useState<{ x: number; time: number } | null>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const [flash, setFlash] = useState<"forward" | "back" | null>(null)

  /* ───────────────────────── HLS wiring ───────────────────────── */

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const src = `/api/video/${itemId}/master.m3u8`

    let hls: Hls | null = null
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: false })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(hls!.levels ?? [])
      })
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        setActiveLevel(data.level)
      })
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari / iOS: native HLS. Key + manifest requests carry cookies.
      video.src = src
    }

    return () => {
      hls?.destroy()
      hlsRef.current = null
    }
  }, [itemId])

  // Keep the <video> in sync with React-owned volume / rate.
  useEffect(() => {
    const v = videoRef.current
    if (v) {
      v.volume = volume
      v.muted = muted
    }
  }, [volume, muted])

  useEffect(() => {
    const v = videoRef.current
    if (v) v.playbackRate = rate
  }, [rate])

  /* ───────────────────────── progress ───────────────────────── */

  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration || 0)
    setReady(true)
    // Resume, but don't drop the viewer right at the end of a finished video.
    if (lastPositionSec && lastPositionSec < v.duration * 0.98) {
      v.currentTime = lastPositionSec
    }
  }, [lastPositionSec])

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const t = v.currentTime
    setCurrent(t)
    if (v.buffered.length) {
      setBuffered(v.buffered.end(v.buffered.length - 1))
    }

    // One-shot completion at 85% (or on `ended`, below).
    if (!completedRef.current && t / v.duration >= COMPLETE_AT) {
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
  }, [itemId])

  const onEnded = useCallback(() => {
    const v = videoRef.current
    setPlaying(false)
    if (!v || completedRef.current) return
    completedRef.current = true
    void saveVideoPosition(itemId, v.currentTime || 0, true).catch(() => {})
  }, [itemId])

  /* ───────────────────────── control helpers ───────────────────────── */

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [])

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.min(Math.max(0, v.currentTime + delta), v.duration || 0)
    setFlash(delta > 0 ? "forward" : "back")
  }, [])

  const seekTo = useCallback((time: number) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    v.currentTime = Math.min(Math.max(0, time), v.duration)
    setCurrent(v.currentTime)
  }, [])

  const changeVolume = useCallback((val: number) => {
    const clamped = Math.min(1, Math.max(0, val))
    setVolume(clamped)
    setMuted(clamped === 0)
  }, [])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {})
    } else {
      void el.requestFullscreen().catch(() => {})
    }
  }, [])

  const togglePip = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture().catch(() => {})
    } else if (document.pictureInPictureEnabled) {
      void v.requestPictureInPicture().catch(() => {})
    }
  }, [])

  const selectQuality = useCallback((idx: number) => {
    setLevelIdx(idx)
    if (hlsRef.current) hlsRef.current.currentLevel = idx
    setSettingsPage("main")
  }, [])

  /* ───────────────────────── auto-hide controls ───────────────────────── */

  const interactingRef = useRef(false)

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      // Keep controls up while the video is paused, a menu is open, or scrubbing.
      if (videoRef.current && !videoRef.current.paused && !interactingRef.current) {
        setControlsVisible(false)
        setSettingsOpen(false)
      }
    }, CONTROLS_HIDE_MS)
  }, [])

  useEffect(() => {
    interactingRef.current = settingsOpen || scrubbing
  }, [settingsOpen, scrubbing])

  useEffect(() => {
    if (!playing) setControlsVisible(true)
  }, [playing])

  /* ───────────────────────── fullscreen / pip listeners ───────────────────────── */

  useEffect(() => {
    const onFs = () => setIsFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    setPipSupported(typeof document !== "undefined" && !!document.pictureInPictureEnabled)
    const onEnter = () => setIsPip(true)
    const onLeave = () => setIsPip(false)
    v.addEventListener("enterpictureinpicture", onEnter)
    v.addEventListener("leavepictureinpicture", onLeave)
    return () => {
      v.removeEventListener("enterpictureinpicture", onEnter)
      v.removeEventListener("leavepictureinpicture", onLeave)
    }
  }, [])

  /* ───────────────────────── flash badge fade ───────────────────────── */

  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), 500)
    return () => clearTimeout(id)
  }, [flash])

  /* ───────────────────────── keyboard shortcuts ───────────────────────── */

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "arrowleft":
        case "j":
          e.preventDefault()
          seekBy(-SKIP_SEC)
          break
        case "arrowright":
        case "l":
          e.preventDefault()
          seekBy(SKIP_SEC)
          break
        case "arrowup":
          e.preventDefault()
          changeVolume(volume + 0.05)
          break
        case "arrowdown":
          e.preventDefault()
          changeVolume(volume - 0.05)
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        default:
          // Number keys 0–9 jump to that % of the video.
          if (/^[0-9]$/.test(e.key) && videoRef.current?.duration) {
            e.preventDefault()
            seekTo((Number(e.key) / 10) * videoRef.current.duration)
          }
          return
      }
      revealControls()
    }
    el.addEventListener("keydown", onKey)
    return () => el.removeEventListener("keydown", onKey)
  }, [
    togglePlay,
    seekBy,
    seekTo,
    changeVolume,
    toggleFullscreen,
    toggleMute,
    revealControls,
    volume,
  ])

  /* ───────────────────────── scrub bar interaction ───────────────────────── */

  const scrubRef = useRef<HTMLDivElement>(null)

  const timeAtClientX = useCallback(
    (clientX: number) => {
      const bar = scrubRef.current
      if (!bar || !duration) return { frac: 0, time: 0, x: 0 }
      const rect = bar.getBoundingClientRect()
      const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      return { frac, time: frac * duration, x: frac * rect.width }
    },
    [duration]
  )

  const onScrubPointerDown = useCallback(
    (e: React.PointerEvent) => {
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      setScrubbing(true)
      const { time, x } = timeAtClientX(e.clientX)
      seekTo(time)
      setScrubHover({ x, time })
    },
    [seekTo, timeAtClientX]
  )

  const onScrubPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const { time, x } = timeAtClientX(e.clientX)
      setScrubHover({ x, time })
      if (scrubbing) seekTo(time)
    },
    [scrubbing, seekTo, timeAtClientX]
  )

  const onScrubPointerUp = useCallback(() => setScrubbing(false), [])

  /* ───────────────────────── render ───────────────────────── */

  const pct = duration ? (current / duration) * 100 : 0
  const bufPct = duration ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
      className={cn(
        "group/player relative select-none overflow-hidden rounded-xl bg-black outline-none",
        !controlsVisible && playing && "cursor-none",
        className
      )}
    >
      <video
        ref={videoRef}
        playsInline
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onProgress={onTimeUpdate}
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        controlsList="nodownload"
        className="h-full w-full object-contain"
      />

      {/* Click-catcher flash badge (play/pause/seek feedback) */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-[fadeScale_0.5s_ease-out] rounded-full bg-black/55 p-5 text-white backdrop-blur-sm">
            {flash === "forward" && <IconRewindForward10 className="h-9 w-9" />}
            {flash === "back" && <IconRewindBackward10 className="h-9 w-9" />}
          </span>
        </div>
      )}

      {/* Buffering spinner */}
      {buffering && playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <IconLoader2 className="h-12 w-12 animate-spin text-white/90" />
        </div>
      )}

      {/* Big center play button when paused */}
      {ready && !playing && !buffering && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center"
        >
          <IconPlayerPlayFilled className="h-16 w-16 text-white/95 drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] transition-transform hover:scale-110 hover:text-sl-purple/50" />
        </button>
      )}

      {/* Top gradient + title (Netflix-style) */}
      {title && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-3 transition-opacity duration-300",
            controlsVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="truncate text-sm font-medium text-white/90 drop-shadow">{title}</p>
        </div>
      )}

      {/* Bottom control bar */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-10 transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Scrub bar */}
        <div className="group/scrub relative mb-1.5 px-1">
          {/* hover time tooltip */}
          {scrubHover && (
            <span
              className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums"
              style={{ left: scrubHover.x + 4 }}
            >
              {formatTime(scrubHover.time)}
            </span>
          )}
          <div
            ref={scrubRef}
            onPointerDown={onScrubPointerDown}
            onPointerMove={onScrubPointerMove}
            onPointerUp={onScrubPointerUp}
            onPointerLeave={() => !scrubbing && setScrubHover(null)}
            className="relative flex h-4 cursor-pointer items-center"
          >
            {/* track */}
            <div className="relative h-1 w-full rounded-full bg-white/25 transition-[height] group-hover/scrub:h-1.5">
              {/* buffered */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/35"
                style={{ width: `${bufPct}%` }}
              />
              {/* played */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sl-blue to-sl-purple"
                style={{ width: `${pct}%` }}
              />
              {/* thumb */}
              <div
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sl-purple opacity-0 shadow transition-opacity group-hover/scrub:opacity-100"
                style={{ left: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-1 text-white">
          <CtrlButton onClick={togglePlay} label={playing ? "Pause" : "Play"}>
            {playing ? (
              <IconPlayerPauseFilled className="h-6 w-6" />
            ) : (
              <IconPlayerPlayFilled className="h-6 w-6" />
            )}
          </CtrlButton>

          <CtrlButton onClick={() => seekBy(-SKIP_SEC)} label="Back 10s">
            <IconRewindBackward10 className="h-6 w-6" />
          </CtrlButton>
          <CtrlButton onClick={() => seekBy(SKIP_SEC)} label="Forward 10s">
            <IconRewindForward10 className="h-6 w-6" />
          </CtrlButton>

          {/* Volume */}
          <div className="group/vol flex items-center">
            <CtrlButton onClick={toggleMute} label={muted ? "Unmute" : "Mute"}>
              {muted || volume === 0 ? (
                <IconVolumeOff className="h-6 w-6" />
              ) : (
                <IconVolume className="h-6 w-6" />
              )}
            </CtrlButton>
            <div className="flex w-0 items-center overflow-hidden opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100">
              <VolumeSlider
                value={muted ? 0 : volume}
                onChange={changeVolume}
              />
            </div>
          </div>

          {/* Time */}
          <span className="ml-1 text-xs font-medium tabular-nums text-white/90">
            {formatTime(current)} <span className="text-white/50">/ {formatTime(duration)}</span>
          </span>

          <div className="flex-1" />

          {/* Settings (speed + quality) */}
          <div className="relative">
            <CtrlButton
              onClick={() => {
                setSettingsOpen((o) => !o)
                setSettingsPage("main")
              }}
              label="Settings"
              active={settingsOpen}
            >
              <IconSettings className={cn("h-6 w-6 transition-transform", settingsOpen && "rotate-45")} />
            </CtrlButton>
            {settingsOpen && (
              <SettingsMenu
                page={settingsPage}
                setPage={setSettingsPage}
                rate={rate}
                setRate={(r) => {
                  setRate(r)
                  setSettingsPage("main")
                }}
                levels={levels}
                levelIdx={levelIdx}
                activeLevel={activeLevel}
                onSelectQuality={selectQuality}
              />
            )}
          </div>

          {pipSupported && (
            <CtrlButton onClick={togglePip} label="Picture in picture" active={isPip}>
              <IconPictureInPicture className="h-6 w-6" />
            </CtrlButton>
          )}

          <CtrlButton onClick={toggleFullscreen} label="Fullscreen">
            {isFullscreen ? (
              <IconMinimize className="h-6 w-6" />
            ) : (
              <IconMaximize className="h-6 w-6" />
            )}
          </CtrlButton>
        </div>
      </div>

      {/* Identifying watermark (anti-screen-capture deterrent) */}
      {watermark && (
        <span className="pointer-events-none absolute right-3 top-3 select-none text-[10px] font-medium text-white/40 mix-blend-difference">
          {watermark}
        </span>
      )}
    </div>
  )
}

/* ───────────────────────── sub-components ───────────────────────── */

function CtrlButton({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/15 hover:text-white",
        active && "text-sl-purple"
      )}
    >
      {children}
    </button>
  )
}

function VolumeSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const update = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    onChange((clientX - rect.left) / rect.width)
  }

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        setDragging(true)
        update(e.clientX)
      }}
      onPointerMove={(e) => dragging && update(e.clientX)}
      onPointerUp={() => setDragging(false)}
      className="relative mx-2 flex h-4 w-16 cursor-pointer items-center"
    >
      <div className="relative h-1 w-full rounded-full bg-white/25">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white"
          style={{ width: `${value * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
          style={{ left: `${value * 100}%` }}
        />
      </div>
    </div>
  )
}

function SettingsMenu({
  page,
  setPage,
  rate,
  setRate,
  levels,
  levelIdx,
  activeLevel,
  onSelectQuality,
}: {
  page: SettingsPage
  setPage: (p: SettingsPage) => void
  rate: number
  setRate: (r: number) => void
  levels: Level[]
  levelIdx: number
  activeLevel: number
  onSelectQuality: (idx: number) => void
}) {
  const hasQuality = levels.length > 1

  return (
    <div className="absolute bottom-11 right-0 z-10 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-black/90 py-1.5 text-sm text-white shadow-xl backdrop-blur">
      {page === "main" && (
        <>
          <MenuRow onClick={() => setPage("speed")}>
            <span>Playback speed</span>
            <span className="flex items-center gap-1 text-white/60">
              {rate === 1 ? "Normal" : `${rate}×`}
              <IconChevronRight className="h-4 w-4" />
            </span>
          </MenuRow>
          {hasQuality && (
            <MenuRow onClick={() => setPage("quality")}>
              <span>Quality</span>
              <span className="flex items-center gap-1 text-white/60">
                {levelIdx === -1
                  ? `Auto${activeLevel >= 0 && levels[activeLevel] ? ` (${levels[activeLevel].height}p)` : ""}`
                  : `${levels[levelIdx]?.height}p`}
                <IconChevronRight className="h-4 w-4" />
              </span>
            </MenuRow>
          )}
        </>
      )}

      {page === "speed" && (
        <>
          <MenuHeader onBack={() => setPage("main")}>Playback speed</MenuHeader>
          {SPEEDS.map((s) => (
            <MenuRow key={s} onClick={() => setRate(s)}>
              <span>{s === 1 ? "Normal" : `${s}×`}</span>
              {rate === s && <IconCheck className="h-4 w-4 text-sl-purple" />}
            </MenuRow>
          ))}
        </>
      )}

      {page === "quality" && (
        <>
          <MenuHeader onBack={() => setPage("main")}>Quality</MenuHeader>
          <MenuRow onClick={() => onSelectQuality(-1)}>
            <span>
              Auto
              {activeLevel >= 0 && levels[activeLevel] && (
                <span className="text-white/50"> ({levels[activeLevel].height}p)</span>
              )}
            </span>
            {levelIdx === -1 && <IconCheck className="h-4 w-4 text-sl-purple" />}
          </MenuRow>
          {levels
            .map((lvl, idx) => ({ lvl, idx }))
            .sort((a, b) => b.lvl.height - a.lvl.height)
            .map(({ lvl, idx }) => (
              <MenuRow key={idx} onClick={() => onSelectQuality(idx)}>
                <span>{lvl.height}p</span>
                {levelIdx === idx && <IconCheck className="h-4 w-4 text-sl-purple" />}
              </MenuRow>
            ))}
        </>
      )}
    </div>
  )
}

function MenuRow({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-6 px-3.5 py-2 text-left transition-colors hover:bg-white/10"
    >
      {children}
    </button>
  )
}

function MenuHeader({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-1 flex w-full items-center gap-2 border-b border-white/10 px-3 py-2 text-left font-medium transition-colors hover:bg-white/5"
    >
      <IconChevronLeft className="h-4 w-4" />
      {children}
    </button>
  )
}

/** Seconds → `m:ss` or `h:mm:ss`. */
function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ss = String(s).padStart(2, "0")
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`
  return `${m}:${ss}`
}

export default SecureVideoPlayer
