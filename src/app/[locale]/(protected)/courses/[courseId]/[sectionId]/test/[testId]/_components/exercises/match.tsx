"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { IconCheck, IconGripVertical, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { ExercisePhase, MatchDraft, MatchExercise } from "@/lib/course-exercises"

type Props = {
  exercise: MatchExercise
  value: MatchDraft
  onChange: (value: MatchDraft) => void
  phase: ExercisePhase
}

const DRAG_MIME = "application/x-greeting-id"

/**
 * Match each situation (left) with a greeting (right). Two ways to answer:
 *   - Drag a greeting chip from the pool onto a situation's slot, or
 *   - Tap a chip to select it, then tap a situation (touch-friendly fallback).
 * Tap a filled slot to send its chip back to the pool.
 */
const Match = ({ exercise, value, onChange, phase }: Props) => {
  const t = useTranslations("courses.test")
  const [picked, setPicked] = useState<string | null>(null) // a right id, selected via tap
  const [dragOver, setDragOver] = useState<string | null>(null) // a left id being hovered
  const locked = phase !== "answering"

  const rightById = (id: string) => exercise.right.find((r) => r.id === id)
  const usedRightIds = new Set(Object.values(value))
  const pool = exercise.right.filter((r) => !usedRightIds.has(r.id))

  /** Assign a greeting to a situation, freeing it from any previous slot. */
  const assign = (leftId: string, rightId: string) => {
    if (locked) return
    const next: MatchDraft = {}
    for (const [l, r] of Object.entries(value)) {
      if (r !== rightId) next[l] = r
    }
    next[leftId] = rightId
    onChange(next)
    setPicked(null)
  }

  const clearSlot = (leftId: string) => {
    if (locked) return
    const next = { ...value }
    delete next[leftId]
    onChange(next)
  }

  const onLeftTap = (leftId: string) => {
    if (locked) return
    if (picked) {
      assign(leftId, picked)
    } else if (value[leftId]) {
      clearSlot(leftId)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-muted-foreground">{t(exercise.promptKey)}</p>

      {/* Situations with drop slots */}
      <div className="space-y-3">
        {exercise.left.map((item) => {
          const assigned = value[item.id]
          const assignedText = assigned ? rightById(assigned)?.text : null
          const correct = locked && assigned === exercise.solution[item.id]
          const incorrect = locked && assigned && assigned !== exercise.solution[item.id]
          const isDropTarget = dragOver === item.id

          return (
            <div
              key={item.id}
              onDragOver={(e) => {
                if (locked) return
                e.preventDefault()
                setDragOver(item.id)
              }}
              onDragLeave={() => setDragOver((d) => (d === item.id ? null : d))}
              onDrop={(e) => {
                if (locked) return
                e.preventDefault()
                const rightId = e.dataTransfer.getData(DRAG_MIME)
                if (rightId) assign(item.id, rightId)
                setDragOver(null)
              }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 p-3 transition-colors",
                "border-black/10 bg-white shadow-[0_3px_0_0] shadow-black/10 dark:border-white/10 dark:bg-white/5 dark:shadow-white/10",
                isDropTarget && "border-sl-accent bg-sl-accent/5",
                correct && "border-green-500/60 bg-green-50 shadow-green-600/30 dark:bg-green-950/30",
                incorrect && "border-red-500/60 bg-red-50 shadow-red-600/30 dark:bg-red-950/30"
              )}
            >
              <span className="flex-1 text-sm font-medium text-foreground">
                {t(item.promptKey)}
              </span>

              {/* Drop slot */}
              {assignedText ? (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onLeftTap(item.id)}
                  className={cn(
                    "inline-flex min-w-28 items-center justify-center gap-1 rounded-xl border-2 px-3 py-2 text-base font-semibold transition-colors",
                    locked
                      ? correct
                        ? "border-green-500/60 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                        : "border-red-500/60 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                      : "border-sl-accent bg-sl-accent/10 text-foreground hover:bg-sl-accent/20 cursor-pointer"
                  )}
                >
                  {assignedText}
                  {locked &&
                    (correct ? (
                      <IconCheck className="h-4 w-4" />
                    ) : (
                      <IconX className="h-4 w-4" />
                    ))}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={locked || !picked}
                  onClick={() => onLeftTap(item.id)}
                  className={cn(
                    "inline-flex min-w-28 items-center justify-center rounded-xl border-2 border-dashed px-3 py-2 text-sm transition-colors",
                    picked && !locked
                      ? "border-sl-accent/60 bg-sl-accent/5 text-sl-accent cursor-pointer"
                      : "border-black/15 text-muted-foreground dark:border-white/15"
                  )}
                >
                  {t("match.dropHere")}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Pool of draggable greeting chips */}
      <div className="min-h-16 rounded-2xl border border-black/5 bg-muted/40 p-3 dark:border-white/5">
        <div className="flex flex-wrap gap-2">
          {pool.length === 0 && !locked && (
            <span className="px-2 py-2 text-sm text-muted-foreground">
              {t("match.allPlaced")}
            </span>
          )}
          {pool.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={locked}
              draggable={!locked}
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_MIME, item.id)
                e.dataTransfer.effectAllowed = "move"
                setPicked(item.id)
              }}
              onDragEnd={() => setPicked(null)}
              onClick={() => setPicked((p) => (p === item.id ? null : item.id))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-base font-semibold shadow-[0_2px_0_0] transition-[colors,transform] active:scale-[0.97]",
                picked === item.id
                  ? "border-sl-accent bg-sl-accent/10 text-foreground shadow-sl-accent/40"
                  : "border-black/10 bg-white text-foreground shadow-black/10 hover:bg-sl-accent/5 dark:border-white/10 dark:bg-white/5 dark:shadow-white/10",
                !locked && "cursor-grab active:cursor-grabbing"
              )}
            >
              <IconGripVertical className="h-4 w-4 text-muted-foreground" />
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Match
