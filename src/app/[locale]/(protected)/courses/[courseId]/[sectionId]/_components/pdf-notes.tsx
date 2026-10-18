"use client"

import dynamic from "next/dynamic"
import { IconLoader2 } from "@tabler/icons-react"
import { type PdfViewerProps } from "./pdf-viewer"

// react-pdf (pdf.js) isn't SSR-safe, so load the viewer client-side only.
const PdfViewer = dynamic(() => import("./pdf-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl border border-border/50 bg-muted/30">
      <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

const PdfNotes = (props: PdfViewerProps) => <PdfViewer {...props} />

export default PdfNotes
