"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/Page/AnnotationLayer.css"
import {
  IconChevronUp,
  IconChevronDown,
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconMinimize,
  IconLoader2,
  IconCheck,
  IconCircle,
  IconFileText,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { markItemComplete } from "@/actions/progress-actions"

/**
 * Bespoke PDF reader for uploaded (`provider: "s3"`) lecture-note items.
 *
 * Replaces the browser's native PDF chrome (and the old <iframe>) with a
 * branded, consistent viewer built on react-pdf / pdf.js. The bytes come from
 * the enrollment-gated `/api/pdf/[itemId]` route — a same-origin URL, so the
 * Clerk session cookie rides along and the server re-checks access on every
 * request. No plain S3 URL ever reaches the DOM.
 *
 * Owns completion: a one-shot `markItemComplete` fires when the reader is
 * scrolled to the final page (so the module card drops its generic toggle for
 * these items — see module-content.tsx).
 *
 * Protection here is "light": we hide all native download/print affordances and
 * suppress the context menu, but keep the selectable text layer for
 * accessibility. Stronger measures (per-viewer watermark, canvas-only) are
 * tracked in docs/future-asset-security.md.
 */

// react-pdf needs its worker. Resolve it from the bundled pdfjs-dist so there's
// no CDN dependency and no version drift (worker must match the API version).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

// Stable identity — react-pdf warns when `options` changes between renders.
const DOC_OPTIONS = {} as const

const MIN_ZOOM = 0.6
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.2
const MAX_FIT_WIDTH = 900 // cap page width on wide screens for readability

type Props = {
  itemId: number
  title?: string | null
  fileName?: string | null
  completed: boolean
  className?: string
}

function PdfViewer({ itemId, title, fileName, completed, className }: Props) {
  const t = useTranslations("courses.test")

  const scrollRef = useRef<HTMLDivElement>(null) // scrolling page column
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const completedRef = useRef(completed)

  const [numPages, setNumPages] = useState(0)
  const [current, setCurrent] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [fitWidth, setFitWidth] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [done, setDone] = useState(completed)

  const file = useMemo(() => `/api/pdf/${itemId}`, [itemId])
  const pageWidth = fitWidth > 0 ? Math.round(fitWidth * zoom) : undefined

  /* ───────────────────────── fit-to-container width ───────────────────────── */

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => {
      // Leave room for padding + a possible scrollbar, then cap for readability.
      const avail = el.clientWidth - 24
      setFitWidth(Math.max(240, Math.min(avail, MAX_FIT_WIDTH)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ───────────────────────── page tracking + auto-complete ───────────────────────── */

  const markDone = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setDone(true)
    void markItemComplete(itemId).catch(() => {
      // Let the user retry via the manual button on failure.
      completedRef.current = false
      setDone(false)
    })
  }, [itemId])

  // Track the current page + completion from scroll position. IntersectionRatio
  // is unreliable here: PDF pages are usually taller than the viewport, so their
  // ratio never approaches 1. Instead we pick the page sitting under the viewport
  // midline, and complete once scrolled to the bottom.
  useEffect(() => {
    const root = scrollRef.current
    if (!root || !numPages) return

    let ticking = false
    const update = () => {
      ticking = false
      const rootRect = root.getBoundingClientRect()
      const midline = rootRect.top + rootRect.height / 2
      let page = 1
      for (let i = 0; i < numPages; i++) {
        const el = pageRefs.current[i]
        if (el && el.getBoundingClientRect().top <= midline) page = i + 1
      }
      setCurrent(page)
      // Within ~48px of the bottom counts as "reached the end".
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 48) markDone()
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    root.addEventListener("scroll", onScroll, { passive: true })
    update() // initial sync once pages have a measured height
    return () => root.removeEventListener("scroll", onScroll)
  }, [numPages, markDone])

  /* ───────────────────────── navigation ───────────────────────── */

  const goToPage = useCallback((page: number) => {
    const target = pageRefs.current[page - 1]
    target?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)))
  }, [])

  /* ───────────────────────── expand (in-app overlay) ───────────────────────── */

  // Not the native Fullscreen API — that forces a full document relayout and is
  // noticeably laggy. Instead we just promote the reader to a fixed overlay that
  // covers everything else, so toggling is instant.
  const toggleExpand = useCallback(() => setExpanded((e) => !e), [])

  // While expanded: close on Escape and lock background scroll.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false)
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [expanded])

  /* ───────────────────────── render ───────────────────────── */

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border/60 bg-muted/40",
        expanded && "fixed inset-0 z-50 h-screen w-screen rounded-none border-0 bg-background",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border/60 bg-card/80 px-2 py-1.5 backdrop-blur">
        <IconFileText className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="mr-1 min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {title ?? fileName ?? "PDF"}
        </span>

        {/* Page nav */}
        <ToolbarButton
          onClick={() => goToPage(Math.max(1, current - 1))}
          disabled={current <= 1}
          label={t("pdf.prevPage")}
        >
          <IconChevronUp className="h-4 w-4" />
        </ToolbarButton>
        <span className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
          {numPages ? `${current} / ${numPages}` : "—"}
        </span>
        <ToolbarButton
          onClick={() => goToPage(Math.min(numPages, current + 1))}
          disabled={!numPages || current >= numPages}
          label={t("pdf.nextPage")}
        >
          <IconChevronDown className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Zoom */}
        <ToolbarButton onClick={() => zoomBy(-ZOOM_STEP)} disabled={zoom <= MIN_ZOOM} label={t("pdf.zoomOut")}>
          <IconZoomOut className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-10 text-center text-xs font-medium tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton onClick={() => zoomBy(ZOOM_STEP)} disabled={zoom >= MAX_ZOOM} label={t("pdf.zoomIn")}>
          <IconZoomIn className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Completion state */}
        {done ? (
          <span className="inline-flex items-center gap-1 px-1.5 text-xs font-medium text-green-600 dark:text-green-400">
            <IconCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t("items.completed")}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={markDone}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t("items.markComplete")}</span>
          </button>
        )}

        <ToolbarButton onClick={toggleExpand} label={t("pdf.fullscreen")}>
          {expanded ? <IconMinimize className="h-4 w-4" /> : <IconMaximize className="h-4 w-4" />}
        </ToolbarButton>
      </div>

      {/* Scrolling page column */}
      {/* Fixed-height shell: the page column scrolls *inside* this box. When
          expanded it fills the remaining space (min-h-0 lets the flex child
          shrink so it scrolls instead of overflowing the screen). */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-auto bg-muted/30 py-4",
          expanded ? "min-h-0 flex-1" : "h-[70vh]"
        )}
      >
        {loadError ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {t("pdf.error")}
          </div>
        ) : (
          <Document
            file={file}
            options={DOC_OPTIONS}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages)
              pageRefs.current = new Array(numPages).fill(null)
            }}
            onLoadError={() => setLoadError(true)}
            loading={
              <div className="flex h-[60vh] items-center justify-center">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
            className="flex flex-col items-center gap-4"
          >
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                data-page={i + 1}
                ref={(el) => {
                  pageRefs.current[i] = el
                }}
                className="shadow-sm ring-1 ring-black/5"
              >
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderAnnotationLayer
                  renderTextLayer
                  loading={
                    <div
                      className="animate-pulse bg-muted"
                      style={{ width: pageWidth, height: pageWidth ? pageWidth * 1.414 : 600 }}
                    />
                  }
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

export default PdfViewer
