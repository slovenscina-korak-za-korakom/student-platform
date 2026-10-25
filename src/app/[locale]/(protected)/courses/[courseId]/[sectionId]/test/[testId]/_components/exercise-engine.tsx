"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import { IconRefresh, IconTrophy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  emptyDraft,
  isAnswerComplete,
  type CourseTest,
  type ExerciseDraft,
  type ExercisePhase,
  type ExerciseReveal,
} from "@/lib/course-exercises"
import { checkExercise, recordTestAttempt } from "@/actions/progress-actions"
import ExerciseShell from "./exercise-shell"
import MultipleChoice from "./exercises/multiple-choice"
import Sort from "./exercises/sort"
import Match from "./exercises/match"
import Speak from "./exercises/speak"

type Props = {
  test: CourseTest
  /** Back to the module page — only reachable from the completion screen. */
  exitHref: string
}

const ExerciseEngine = ({ test, exitHref }: Props) => {
  const t = useTranslations("courses.test")
  const total = test.exercises.length

  const [index, setIndex] = useState(0)
  const [drafts, setDrafts] = useState<ExerciseDraft[]>(() =>
    test.exercises.map(emptyDraft)
  )
  const [phase, setPhase] = useState<ExercisePhase>("answering")
  const [reveal, setReveal] = useState<ExerciseReveal | null>(null)
  const [checking, setChecking] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  // Answers collected across the test, submitted once at the end for the
  // authoritative (server-graded) record.
  const answersRef = useRef<{ exerciseSlug: string; given: ExerciseDraft }[]>([])

  const exercise = test.exercises[index]
  const draft = drafts[index]
  const progress = ((index + (phase === "answering" ? 0 : 1)) / total) * 100

  const setDraft = (value: ExerciseDraft) =>
    setDrafts((prev) => prev.map((d, i) => (i === index ? value : d)))

  const canCheck = useMemo(
    () => phase === "answering" && !checking && isAnswerComplete(exercise, draft),
    [phase, checking, exercise, draft]
  )

  // Record the current answer, set feedback phase + the revealed solution.
  const settle = (given: ExerciseDraft, correct: boolean, rev: ExerciseReveal | null) => {
    answersRef.current = [
      ...answersRef.current.filter((a) => a.exerciseSlug !== exercise.id),
      { exerciseSlug: exercise.id, given },
    ]
    setReveal(rev)
    if (correct) setCorrectCount((c) => c + 1)
    setPhase(correct ? "correct" : "incorrect")
  }

  // Grading is authoritative on the server (answers aren't shipped to the client).
  const check = async () => {
    if (!canCheck) return
    setChecking(true)
    try {
      const res = await checkExercise(test.sectionSlug, test.id, exercise.id, draft)
      settle(draft, res.correct, res.reveal)
    } catch {
      settle(draft, false, null)
    } finally {
      setChecking(false)
    }
  }

  const skipSpeak = () => {
    const given: ExerciseDraft = { transcript: "", skipped: true }
    setDraft(given)
    settle(given, false, null)
  }

  const next = () => {
    if (index + 1 >= total) {
      setIsComplete(true)
      // Persist the attempt (re-graded server-side); don't block the UI.
      void recordTestAttempt(test.sectionSlug, test.id, answersRef.current).catch(() => {})
      return
    }
    setIndex((i) => i + 1)
    setPhase("answering")
    setReveal(null)
  }

  const retake = () => {
    setIndex(0)
    setDrafts(test.exercises.map(emptyDraft))
    setPhase("answering")
    setReveal(null)
    setCorrectCount(0)
    setIsComplete(false)
    answersRef.current = []
  }

  /* ── Completion screen ── */
  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-8 overflow-y-auto bg-background px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sl-blue/20 via-sl-purple/20 to-sl-pink/20"
        >
          <IconTrophy className="h-9 w-9 text-sl-accent" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="space-y-2">
            <h2 className="font-tanker text-3xl tracking-wide text-foreground">
              {t("complete.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("complete.score", { correct: correctCount, total })}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={retake} variant="outline" size="lg" className="w-full">
              <IconRefresh className="mr-1 h-4 w-4" />
              {t("complete.retry")}
            </Button>
            <Button asChild variant="mine" size="lg" className="h-11 w-full">
              <Link href={exitHref}>{t("complete.back")}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ── Exercise screen ── */
  const locked = phase !== "answering"

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      <ExerciseShell progress={progress}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {exercise.type === "multiple_choice" && (
              <MultipleChoice exercise={exercise} value={draft as string | null} onChange={setDraft} phase={phase} reveal={reveal} />
            )}
            {exercise.type === "sort" && (
              <Sort exercise={exercise} value={draft as Record<string, string>} onChange={setDraft} phase={phase} reveal={reveal} />
            )}
            {exercise.type === "match" && (
              <Match exercise={exercise} value={draft as Record<string, string>} onChange={setDraft} phase={phase} reveal={reveal} />
            )}
            {exercise.type === "speak" && (
              <Speak
                exercise={exercise}
                value={draft as { transcript: string; skipped: boolean }}
                onChange={setDraft}
                phase={phase}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ExerciseShell>

      {/* ── Sticky footer: feedback banner + actions ── */}
      <div
        className={cn(
          "sticky bottom-0 mt-auto border-t transition-colors",
          phase === "correct" && "border-green-500/30 bg-green-50 dark:bg-green-950/20",
          phase === "incorrect" && "border-orange-500/30 bg-orange-50 dark:bg-orange-950/20",
          phase === "answering" && "border-border/60 bg-background"
        )}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <AnimatePresence mode="wait">
            {locked ? (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-2 text-base font-semibold",
                  phase === "correct"
                    ? "text-green-700 dark:text-green-400"
                    : "text-orange-700 dark:text-orange-400"
                )}
              >
                {phase === "correct" ? t("correct") : t("incorrect")}
              </motion.div>
            ) : (
              <div className="hidden sm:block" />
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            {phase === "answering" && exercise.type === "speak" && (
              <Button onClick={skipSpeak} variant="ghost" size="lg" className="h-11">
                {t("skip")}
              </Button>
            )}
            {phase === "answering" ? (
              <Button
                onClick={check}
                disabled={!canCheck}
                variant="mine"
                size="lg"
                className="h-11 min-w-32 disabled:opacity-40"
              >
                {t("check")}
              </Button>
            ) : (
              <Button onClick={next} variant="mine" size="lg" className="h-11 min-w-32">
                {t("continue")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExerciseEngine
