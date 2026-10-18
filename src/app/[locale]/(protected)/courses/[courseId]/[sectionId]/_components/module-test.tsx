"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { IconCheck, IconRefresh, IconTrophy, IconX } from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { type QuizQuestion } from "@/app/[locale]/(protected)/courses/[courseId]/_components/mock"

type Props = {
  questions: QuizQuestion[]
}

type AnswerState = "idle" | "correct" | "incorrect"

const ModuleTest = ({ questions }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>("idle")
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([])
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = questions[currentIndex]
  const progress = (currentIndex / questions.length) * 100

  const handleAnswerSelect = useCallback(
    (answerId: string) => {
      if (answerState !== "idle") return
      setSelectedAnswer(answerId)
    },
    [answerState]
  )

  const handleCheckAnswer = useCallback(() => {
    if (!selectedAnswer || answeredQuestions.includes(currentIndex)) return

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    setAnswerState(isCorrect ? "correct" : "incorrect")
    if (isCorrect) setCorrectCount((c) => c + 1)
    setAnsweredQuestions((prev) => [...prev, currentIndex])

    const isLast = currentIndex + 1 >= questions.length
    setTimeout(() => {
      if (isLast) {
        setIsComplete(true)
      } else {
        setCurrentIndex((i) => i + 1)
        setSelectedAnswer(null)
        setAnswerState("idle")
      }
    }, 1200)
  }, [selectedAnswer, answeredQuestions, currentIndex, currentQuestion, questions.length])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (answerState !== "idle" || isComplete) return
      const numberToLetter: Record<string, string> = { "1": "a", "2": "b", "3": "c", "4": "d" }
      const key = e.key.toLowerCase()

      let optionId: string | null = null
      if (/^[a-d]$/.test(key)) optionId = key
      else if (/^[1-4]$/.test(e.key)) optionId = numberToLetter[e.key]

      if (optionId && currentQuestion.options.some((o) => o.id === optionId)) {
        handleAnswerSelect(optionId)
      }
      if (e.key === "Enter" && selectedAnswer) handleCheckAnswer()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [answerState, isComplete, selectedAnswer, currentQuestion, handleAnswerSelect, handleCheckAnswer])

  const handleRetake = () => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setAnswerState("idle")
    setCorrectCount(0)
    setAnsweredQuestions([])
    setIsComplete(false)
  }

  // Completion screen
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <IconTrophy className="h-6 w-6 text-primary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md space-y-6 text-center"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Test complete</h2>
            <p className="text-muted-foreground">
              You got{" "}
              <span className="font-semibold text-foreground">
                {correctCount} / {questions.length}
              </span>{" "}
              correct.
            </p>
          </div>

          <Button onClick={handleRetake} size="lg" variant="outline" className="w-full">
            <IconRefresh className="mr-1 h-4 w-4" />
            Retake test
          </Button>
        </motion.div>
      </div>
    )
  }

  // Question screen
  return (
    <div className="flex w-full flex-col">
      {/* Progress header */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Module test</span>
        <span className="text-muted-foreground tabular-nums">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mb-8 h-[2px] overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col"
        >
          <div className="space-y-8">
            <h3 className="whitespace-pre-line text-xl font-semibold leading-relaxed text-foreground">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswer === option.id
                const isCorrect = option.id === currentQuestion.correctAnswer
                const showResult = answerState !== "idle"

                let buttonClasses =
                  "border-border/50 hover:border-foreground/20 hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.05]"
                let icon = null

                if (showResult) {
                  if (isCorrect) {
                    buttonClasses = "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
                    if (isSelected)
                      icon = <IconCheck className="h-5 w-5 text-green-600 dark:text-green-500" />
                  } else if (isSelected) {
                    buttonClasses = "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
                    icon = <IconX className="h-5 w-5 text-red-600 dark:text-red-500" />
                  }
                } else if (isSelected) {
                  buttonClasses = "border-primary bg-primary/5 dark:bg-primary/10"
                }

                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={answerState !== "idle"}
                    whileHover={{ scale: answerState === "idle" ? 1.005 : 1 }}
                    whileTap={{ scale: answerState === "idle" ? 0.995 : 1 }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all duration-200",
                      "disabled:cursor-not-allowed",
                      buttonClasses
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          "text-sm font-medium transition-all",
                          isSelected && answerState === "idle"
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/5 text-foreground/60 dark:bg-foreground/10"
                        )}
                      >
                        {option.id.toUpperCase()}
                      </span>
                      <span className="text-base font-medium">{option.text}</span>
                    </div>
                    {icon}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-8 space-y-4">
            <AnimatePresence>
              {answerState !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3 text-center text-sm font-medium",
                      answerState === "correct"
                        ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                        : "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                    )}
                  >
                    {answerState === "correct" ? "Correct!" : "Keep going!"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer || answerState !== "idle"}
              size="lg"
              className="w-full shadow-sm disabled:opacity-40"
            >
              Check answer
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default ModuleTest
