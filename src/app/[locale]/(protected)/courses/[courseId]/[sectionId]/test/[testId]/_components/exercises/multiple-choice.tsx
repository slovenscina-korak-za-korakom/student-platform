"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { IconCheck, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type {
  ExercisePhase,
  ExerciseReveal,
  MultipleChoiceDraft,
  MultipleChoiceExercise,
} from "@/lib/course-exercises"

type Props = {
  exercise: MultipleChoiceExercise
  value: MultipleChoiceDraft
  onChange: (value: MultipleChoiceDraft) => void
  phase: ExercisePhase
  reveal: ExerciseReveal | null
}

const MultipleChoice = ({ exercise, value, onChange, phase, reveal }: Props) => {
  const t = useTranslations("courses.test")
  const locked = phase !== "answering"

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">{t(exercise.promptKey)}</p>
        {exercise.word && (
          <p className="font-tanker text-4xl tracking-wide text-foreground md:text-5xl">
            {exercise.word}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {exercise.options.map((option) => {
          const isSelected = value === option.id
          const isCorrect = option.id === reveal?.correctAnswer

          // Duolingo-ish chunky card with a thick bottom "ledge".
          let classes =
            "border-black/10 bg-white text-foreground shadow-[0_3px_0_0] shadow-black/10 hover:bg-sl-accent/5 dark:border-white/10 dark:bg-white/5 dark:shadow-white/10"
          let icon: React.ReactNode = null

          if (locked) {
            if (isCorrect) {
              classes =
                "border-green-500/60 bg-green-50 text-green-800 shadow-[0_3px_0_0] shadow-green-600/30 dark:bg-green-950/30 dark:text-green-300"
              if (isSelected) icon = <IconCheck className="h-5 w-5" />
            } else if (isSelected) {
              classes =
                "border-red-500/60 bg-red-50 text-red-800 shadow-[0_3px_0_0] shadow-red-600/30 dark:bg-red-950/30 dark:text-red-300"
              icon = <IconX className="h-5 w-5" />
            } else {
              classes = "border-black/10 bg-white text-muted-foreground opacity-60 dark:border-white/10 dark:bg-white/5"
            }
          } else if (isSelected) {
            classes =
              "border-sl-accent bg-sl-accent/10 text-foreground shadow-[0_3px_0_0] shadow-sl-accent/40"
          }

          return (
            <motion.button
              key={option.id}
              type="button"
              disabled={locked}
              onClick={() => onChange(option.id)}
              whileTap={{ scale: locked ? 1 : 0.97 }}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-colors",
                "disabled:cursor-not-allowed",
                classes
              )}
            >
              <span className="text-lg font-semibold">{option.text}</span>
              {icon}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default MultipleChoice
