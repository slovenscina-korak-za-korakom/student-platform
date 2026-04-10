"use client"

import Skeleton from "react-loading-skeleton"
import { useSearchParams } from "next/navigation"

const DAYS = 7
const WEEKS = 6

// ── Month skeleton ────────────────────────────────────────────────────────────
const MonthSkeleton = () => (
  <div className="flex-1 flex flex-col min-h-0">
    {/* Day-of-week header */}
    <div className="grid grid-cols-7 mb-1">
      {Array.from({ length: DAYS }).map((_, i) => (
        <div key={i} className="flex justify-center py-1">
          <Skeleton width={28} height={14} containerClassName="leading-0" />
        </div>
      ))}
    </div>

    {/* Calendar cells */}
    <div className="flex-1 grid grid-rows-6 gap-1 min-h-0">
      {Array.from({ length: WEEKS }).map((_, week) => (
        <div key={week} className="grid grid-cols-7 gap-1 min-h-0">
          {Array.from({ length: DAYS }).map((_, day) => (
            <div key={day} className="border border-border/30 rounded-xl p-3 flex flex-col gap-1 overflow-hidden pb-5 pl-5">
              <Skeleton width={22} height={22} circle containerClassName="ml-auto leading-0" />
              {(week + day) % 3 === 0 && (
                <Skeleton height={60} width={96} borderRadius={8} containerClassName="mt-auto leading-0" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
)

// ── Week / multi-day time-grid skeleton ───────────────────────────────────────
// Mirrors FullCalendar's timeGrid layout:
//   • sticky header row: gutter spacer + day columns (weekday label + date circle)
//   • scrollable body: time gutter (hour labels every 3rem) + slot columns
// .fc-timegrid-slot { height: 3rem } → each slot row is h-12
const SLOT_ROWS = 18 // enough to fill screen; overflow-hidden clips the rest

const WeekSkeleton = ({ cols }: { cols: number }) => (
  <div className="flex-1 flex flex-col min-h-0 max-h-screen overflow-hidden">

    {/* ── Sticky header ── */}
    <div className="flex flex-shrink-0 border-b border-border/30">
      {/* Gutter spacer */}
      <div className="w-14 flex-shrink-0" />
      {/* Day columns */}
      <div className="flex-1 grid border-l border-border/20" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 py-2 border-r border-border/10 last:border-r-0">
            <Skeleton width={24} height={12} containerClassName="leading-none" />
            <Skeleton width={32} height={32} circle containerClassName="leading-none" />
          </div>
        ))}
      </div>
    </div>

    {/* ── Scrollable body ── */}
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* Time gutter */}
      <div className="w-14 flex-shrink-0 flex flex-col overflow-hidden">
        {Array.from({ length: SLOT_ROWS }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex items-start justify-end pr-2 pt-1" style={{ height: "3rem" }}>
            {/* Skip first slot label (matches FC behaviour) */}
            {i > 0 && <Skeleton width={32} height={11} containerClassName="leading-none" />}
          </div>
        ))}
      </div>

      {/* Slot columns */}
      <div className="flex-1 grid border-l border-border/20 relative overflow-hidden" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, col) => (
          <div key={col} className="relative border-r border-border/10 last:border-r-0 overflow-hidden">
            {/* Horizontal slot lines */}
            {Array.from({ length: SLOT_ROWS }).map((_, row) => (
              <div key={row} className="border-t border-border/20" style={{ height: "3rem" }} />
            ))}
            {/* Occasional event block */}
            {(col + 1) % 2 === 0 && (
              <div className="absolute inset-x-1" style={{ top: "3rem" }}>
                <Skeleton height={80} borderRadius={6} containerClassName="leading-none" />
              </div>
            )}
            {(col + 2) % 3 === 0 && (
              <div className="absolute inset-x-1" style={{ top: "7.5rem" }}>
                <Skeleton height={56} borderRadius={6} containerClassName="leading-none" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ── List skeleton ─────────────────────────────────────────────────────────────
const ListSkeleton = () => (
  <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex gap-4 items-start">
        <Skeleton width={56} height={16} containerClassName="leading-0 flex-shrink-0 mt-1" />
        <div className="flex-1 flex flex-col gap-1">
          <Skeleton height={48} borderRadius={6} containerClassName="leading-0" />
        </div>
      </div>
    ))}
  </div>
)

// ── Controls bar (shared) ─────────────────────────────────────────────────────
const Controls = () => (
  <div className="flex flex-col gap-4 mb-6 border-b border-border pb-4 flex-shrink-0">
    <div className="flex items-center justify-center">
      <Skeleton width={280} height={40} />
    </div>
    <div className="flex flex-col md:flex-row items-center gap-4 justify-center w-full md:justify-between">
      <div className="flex items-center gap-2">
        <Skeleton width={32} height={32} borderRadius={6} containerClassName="leading-0" />
        <Skeleton width={128} height={32} borderRadius={6} containerClassName="leading-0" />
        <Skeleton width={32} height={32} borderRadius={6} containerClassName="leading-0" />
        <Skeleton width={64} height={32} borderRadius={6} containerClassName="leading-0" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width={90} height={20} />
        <div className="flex -space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} circle width={32} height={32} containerClassName="leading-0" />
          ))}
        </div>
      </div>
    </div>
  </div>
)

// ── Root loading component ────────────────────────────────────────────────────
const CalendarLoading = () => {
  const searchParams = useSearchParams()
  const view = searchParams.get("view") ?? "month"

  return (
    <div className="overflow-hidden flex flex-col p-7" style={{ height: "calc(100dvh - var(--header-height))" }}>
      <Controls />
      {view === "month" && <MonthSkeleton />}
      {(view === "week") && <WeekSkeleton cols={7} />}
      {view === "2days" && <WeekSkeleton cols={2} />}
      {view === "3days" && <WeekSkeleton cols={3} />}
      {view === "day" && <WeekSkeleton cols={1} />}
      {view === "list" && <ListSkeleton />}
    </div>
  )
}

export default CalendarLoading
