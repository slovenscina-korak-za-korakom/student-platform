"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import {
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconLoader2,
} from "@tabler/icons-react"

// pdf.js worker (engine only — not the document itself)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export type PdfViewerProps = {
  /** Auth-gated endpoint that streams the PDF bytes. */
  fileUrl: string
  title: string
  /** Logged-in user's email/id, tiled over every page as a traceable watermark. */
  watermark: string
}

const PdfViewer = ({ fileUrl, title, watermark }: PdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(680)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(false)

  // Keep the rendered page matched to the container width.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPage(1)
  }, [])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <IconFileText className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      </div>

      {/* Viewer — selection + context menu disabled */}
      <div
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        className="relative select-none overflow-hidden rounded-xl border border-border/50 bg-muted/30"
      >
        {error ? (
          <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            Lecture notes are unavailable right now.
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={() => setError(true)}
            loading={
              <div className="flex h-64 items-center justify-center">
                <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
            className="flex justify-center"
          >
            <div className="relative">
              <Page
                pageNumber={page}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />

              {/* Per-user watermark overlay */}
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-wrap content-start items-start gap-x-16 gap-y-20 overflow-hidden rotate-[-30deg] scale-150 opacity-[0.10]">
                {Array.from({ length: 80 }).map((_, i) => (
                  <span
                    key={i}
                    className="whitespace-nowrap text-xs font-semibold text-black"
                  >
                    {watermark}
                  </span>
                ))}
              </div>
            </div>
          </Document>
        )}
      </div>

      {/* Pager */}
      {!error && numPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1.5"
          >
            <IconChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            Page {page} / {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= numPages}
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            className="gap-1.5"
          >
            Next
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default PdfViewer
