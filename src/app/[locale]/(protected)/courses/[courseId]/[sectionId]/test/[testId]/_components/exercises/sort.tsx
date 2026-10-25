"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { IconCheck, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { ExercisePhase, ExerciseReveal, SortDraft, SortExercise } from "@/lib/course-exercises"

type Props = {
  exercise: SortExercise
  value: SortDraft
  onChange: (value: SortDraft) => void
  phase: ExercisePhase
  reveal: ExerciseReveal | null
}

const DRAG_MIME = "application/x-sort-item"

/**
 * Sort words into two buckets. Two ways to answer:
 *   - Drag a word (from the tray or another bucket) onto a bucket, or
 *   - Tap a word to select it, then tap a bucket (touch-friendly fallback).
 * Tap a placed word to send it back to the tray.
 */
const Sort = ({ exercise, value, onChange, phase, reveal }: Props) => {
  const t = useTranslations("courses.test")
  const [picked, setPicked] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const locked = phase !== "answering"

  const tray = exercise.items.filter((i) => !value[i.id])

  const placeInBucket = (bucketId: string, itemId: string) => {
    if (locked) return
    onChange({ ...value, [itemId]: bucketId })
    setPicked(null)
  }

  const removeFromBucket = (itemId: string) => {
    if (locked) return
    const next = { ...value }
    delete next[itemId]
    onChange(next)
  }

  const onBucketTap = (bucketId: string) => {
    if (locked || !picked) return
    placeInBucket(bucketId, picked)
  }

  // Shared drag handlers for any word chip (tray or placed).
  const dragProps = (itemId: string) =>
    locked
      ? {}
      : {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.setData(DRAG_MIME, itemId)
            e.dataTransfer.effectAllowed = "move"
            setPicked(itemId)
          },
          onDragEnd: () => setPicked(null),
        }

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-muted-foreground">{t(exercise.promptKey)}</p>

      {/* Buckets (drop targets) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {exercise.buckets.map((bucket) => {
          const placed = exercise.items.filter((i) => value[i.id] === bucket.id)
          const isDropTarget = dragOver === bucket.id
          return (
            <div
              key={bucket.id}
              onClick={() => onBucketTap(bucket.id)}
              onDragOver={(e) => {
                if (locked) return
                e.preventDefault()
                setDragOver(bucket.id)
              }}
              onDragLeave={() => setDragOver((d) => (d === bucket.id ? null : d))}
              onDrop={(e) => {
                if (locked) return
                e.preventDefault()
                const itemId = e.dataTransfer.getData(DRAG_MIME)
                if (itemId) placeInBucket(bucket.id, itemId)
                setDragOver(null)
              }}
              className={cn(
                "flex min-h-32 flex-col gap-3 rounded-2xl border-2 border-dashed p-4 transition-colors",
                isDropTarget
                  ? "border-sl-accent bg-sl-accent/10"
                  : picked && !locked
                    ? "border-sl-accent/60 bg-sl-accent/5 cursor-pointer"
                    : "border-black/10 dark:border-white/10"
              )}
            >
              <span className="font-tanker text-lg tracking-wide text-foreground">
                {t(bucket.labelKey)}
              </span>
              <div className="flex flex-wrap gap-2">
                {placed.map((item) => {
                  const ok = reveal?.correctBuckets?.[item.id] === bucket.id
                  return (
                    <span
                      key={item.id}
                      {...dragProps(item.id)}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromBucket(item.id)
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-xl border-2 px-3 py-1.5 text-base font-semibold shadow-[0_2px_0_0]",
                        locked
                          ? ok
                            ? "border-green-500/60 bg-green-50 text-green-800 shadow-green-600/30 dark:bg-green-950/30 dark:text-green-300"
                            : "border-red-500/60 bg-red-50 text-red-800 shadow-red-600/30 dark:bg-red-950/30 dark:text-red-300"
                          : "border-black/10 bg-white text-foreground shadow-black/10 cursor-grab active:cursor-grabbing dark:border-white/10 dark:bg-white/5 dark:shadow-white/10"
                      )}
                    >
                      {item.text}
                      {locked &&
                        (ok ? (
                          <IconCheck className="h-3.5 w-3.5" />
                        ) : (
                          <IconX className="h-3.5 w-3.5" />
                        ))}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tray of unassigned words (also a drop target: drag back to unassign) */}
      <div
        onDragOver={(e) => {
          if (locked) return
          e.preventDefault()
          setDragOver("tray")
        }}
        onDragLeave={() => setDragOver((d) => (d === "tray" ? null : d))}
        onDrop={(e) => {
          if (locked) return
          e.preventDefault()
          const itemId = e.dataTransfer.getData(DRAG_MIME)
          if (itemId) removeFromBucket(itemId)
          setDragOver(null)
        }}
        className={cn(
          "min-h-16 rounded-2xl border p-3 transition-colors",
          dragOver === "tray"
            ? "border-sl-accent bg-sl-accent/5"
            : "border-black/5 bg-muted/40 dark:border-white/5"
        )}
      >
        <div className="flex flex-wrap gap-2">
          {tray.length === 0 && !locked && (
            <span className="px-2 py-1.5 text-sm text-muted-foreground">
              {t("sort.allPlaced")}
            </span>
          )}
          {tray.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={locked}
              {...dragProps(item.id)}
              onClick={() => setPicked((p) => (p === item.id ? null : item.id))}
              className={cn(
                "rounded-xl border-2 px-3 py-1.5 text-base font-semibold shadow-[0_2px_0_0] transition-[colors,transform] active:scale-[0.97]",
                picked === item.id
                  ? "border-sl-accent bg-sl-accent/10 text-foreground shadow-sl-accent/40"
                  : "border-black/10 bg-white text-foreground shadow-black/10 hover:bg-sl-accent/5 dark:border-white/10 dark:bg-white/5 dark:shadow-white/10",
                !locked && "cursor-grab active:cursor-grabbing"
              )}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sort
