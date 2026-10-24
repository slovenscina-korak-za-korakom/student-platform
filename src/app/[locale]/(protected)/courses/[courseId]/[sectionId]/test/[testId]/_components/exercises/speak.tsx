"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { IconMicrophone, IconPlayerStopFilled } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { ExercisePhase, SpeakDraft, SpeakExercise } from "@/lib/course-exercises"

type Props = {
  exercise: SpeakExercise
  value: SpeakDraft
  onChange: (value: SpeakDraft) => void
  phase: ExercisePhase
}

/* Minimal typings for the Web Speech API (not in the DOM lib). */
type SpeechRecognitionResult = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((e: SpeechRecognitionResult) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

type MicState = "idle" | "listening" | "denied" | "unsupported"

const Speak = ({ exercise, value, onChange, phase }: Props) => {
  const t = useTranslations("courses.test")
  const [micState, setMicState] = useState<MicState>("idle")
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const locked = phase !== "answering"

  useEffect(() => {
    if (!getRecognitionCtor()) setMicState("unsupported")
    return () => recognitionRef.current?.stop()
  }, [])

  const startListening = () => {
    if (locked) return
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      setMicState("unsupported")
      return
    }
    const recognition = new Ctor()
    recognition.lang = "sl-SI"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ""
      onChange({ transcript, skipped: false })
    }
    recognition.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicState("denied")
      } else {
        setMicState("idle")
      }
    }
    recognition.onend = () => setMicState("idle")
    recognitionRef.current = recognition
    setMicState("listening")
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setMicState("idle")
  }

  const matched = locked && !value.skipped && value.transcript.trim().length > 0
  const isListening = micState === "listening"

  return (
    <div className="flex flex-col items-center space-y-8 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">{t(exercise.promptKey)}</p>
        <p className="font-tanker text-5xl tracking-wide text-foreground md:text-6xl">
          {exercise.word}
        </p>
      </div>

      {/* Mic button */}
      <motion.button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={locked || micState === "unsupported"}
        whileTap={{ scale: locked ? 1 : 0.92 }}
        className={cn(
          "relative flex h-24 w-24 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          isListening
            ? "border-sl-accent bg-sl-accent text-white"
            : "border-sl-accent/40 bg-sl-accent/10 text-sl-accent hover:bg-sl-accent/20"
        )}
      >
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-full bg-sl-accent/40"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        {isListening ? (
          <IconPlayerStopFilled className="h-9 w-9" />
        ) : (
          <IconMicrophone className="h-9 w-9" />
        )}
      </motion.button>

      {/* Status line */}
      <div className="min-h-6 text-sm">
        {micState === "unsupported" && (
          <span className="text-muted-foreground">{t("speak.unsupported")}</span>
        )}
        {micState === "denied" && (
          <span className="text-muted-foreground">{t("speak.denied")}</span>
        )}
        {isListening && <span className="text-sl-accent">{t("speak.listening")}</span>}
        {!isListening &&
          micState === "idle" &&
          value.transcript &&
          !value.skipped && (
            <span className={cn(locked && matched ? "text-green-600" : "text-foreground")}>
              {t("speak.heard", { text: value.transcript })}
            </span>
          )}
        {!isListening && micState === "idle" && !value.transcript && (
          <span className="text-muted-foreground">{t("speak.tapToStart")}</span>
        )}
      </div>
    </div>
  )
}

export default Speak
