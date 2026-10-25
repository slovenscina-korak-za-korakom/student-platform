/**
 * Interactive course tests (Duolingo-style exercise engine).
 *
 * A module (section) can host one or more *tests*, each addressed in the URL by
 * its `id`:  /courses/[courseId]/[sectionId]/test/[testId]
 *
 * This module is the shared *contract* consumed by the exercise renderers and
 * the engine: the `Exercise`/`CourseTest` types, the draft-answer types, and the
 * grading helpers (`emptyDraft`, `isAnswerComplete`, `gradeExercise`). The actual
 * content now lives in the database (`course_tests` + `exercises`) and is mapped
 * into these types by `getTestBySlug` in `src/actions/course-actions.ts`.
 *
 * Content split, per product decision:
 *   - INSTRUCTIONS / prompts / labels -> next-intl keys (translate per locale),
 *     resolved against the `courses.test` namespace.
 *   - Slovene TARGET material (words, phonetic transcriptions, greetings) is
 *     stored verbatim in the exercise `data`.
 */

import type {
  ExerciseData,
  MultipleChoiceData,
  SortData,
  MatchData,
  SpeakData,
} from "@/db/schema"

/** Phase a single exercise is in, shared by the engine and renderers. */
export type ExercisePhase = "answering" | "correct" | "incorrect"

/** 1) Pick the correct option (e.g. the right pronunciation of a word). */
export type MultipleChoiceExercise = {
  type: "multiple_choice"
  id: string
  /** i18n key for the instruction. */
  promptKey: string
  /** Optional big fixed Slovene word shown above the options. */
  word?: string
  /** Fixed option text (phonetic transcriptions, Slovene words…). */
  options: { id: string; text: string }[]
  /** The id of the correct option. */
  correctAnswer: string
}

/** 2) Tap each item into one of two buckets (classification / grouping). */
export type SortExercise = {
  type: "sort"
  id: string
  promptKey: string
  /** Exactly two buckets; `labelKey` is an i18n key. */
  buckets: [{ id: string; labelKey: string }, { id: string; labelKey: string }]
  /** Each item's `bucket` is the id of the bucket it belongs in. */
  items: { id: string; text: string; bucket: string }[]
}

/** 3) Match each left prompt (translated) to the right option (fixed). */
export type MatchExercise = {
  type: "match"
  id: string
  promptKey: string
  /** Left column: situations etc. — `promptKey` is an i18n key. */
  left: { id: string; promptKey: string }[]
  /** Right column: fixed Slovene greetings/answers. */
  right: { id: string; text: string }[]
  /** Correct pairing: left id → right id. */
  solution: Record<string, string>
}

/** 4) Say the word into the microphone (always skippable). */
export type SpeakExercise = {
  type: "speak"
  id: string
  promptKey: string
  /** The fixed Slovene word/phrase to pronounce. */
  word: string
  /** Accepted transcriptions (lowercased). Diacritics are folded on compare. */
  accept: string[]
}

export type Exercise =
  | MultipleChoiceExercise
  | SortExercise
  | MatchExercise
  | SpeakExercise

export type CourseTest = {
  /** URL id — unique within a section. */
  id: string
  /** Slug of the section (module) this test belongs to. */
  sectionSlug: string
  /** i18n key for the test's display title. */
  titleKey: string
  exercises: Exercise[]
}

/* ───────────────────────── Draft answers ───────────────────────── */

/** The in-progress answer for each exercise type (engine-side state). */
export type MultipleChoiceDraft = string | null
export type SortDraft = Record<string, string> // itemId → bucketId
export type MatchDraft = Record<string, string> // leftId → rightId
export type SpeakDraft = { transcript: string; skipped: boolean }

export type ExerciseDraft =
  | MultipleChoiceDraft
  | SortDraft
  | MatchDraft
  | SpeakDraft

/** A fresh, empty draft for a given exercise. */
export function emptyDraft(exercise: Exercise): ExerciseDraft {
  switch (exercise.type) {
    case "multiple_choice":
      return null
    case "sort":
      return {}
    case "match":
      return {}
    case "speak":
      return { transcript: "", skipped: false }
  }
}

/** Whether the learner has supplied enough to press "Check". */
export function isAnswerComplete(exercise: Exercise, draft: ExerciseDraft): boolean {
  switch (exercise.type) {
    case "multiple_choice":
      return (draft as MultipleChoiceDraft) !== null
    case "sort":
      return exercise.items.every((i) => (draft as SortDraft)[i.id])
    case "match":
      return exercise.left.every((l) => (draft as MatchDraft)[l.id])
    case "speak": {
      const d = draft as SpeakDraft
      return d.skipped || d.transcript.trim().length > 0
    }
  }
}

/** Fold case + diacritics so "Čokolada" ≈ "cokolada" on compare. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Grade a completed answer. A skipped speak exercise counts as incorrect. */
export function gradeExercise(exercise: Exercise, draft: ExerciseDraft): boolean {
  switch (exercise.type) {
    case "multiple_choice":
      return (draft as MultipleChoiceDraft) === exercise.correctAnswer
    case "sort":
      return exercise.items.every((i) => (draft as SortDraft)[i.id] === i.bucket)
    case "match":
      return exercise.left.every(
        (l) => (draft as MatchDraft)[l.id] === exercise.solution[l.id]
      )
    case "speak": {
      const d = draft as SpeakDraft
      if (d.skipped || !d.transcript.trim()) return false
      const said = normalize(d.transcript)
      return exercise.accept.some((a) => normalize(a) === said)
    }
  }
}

/* ───────────── DB ↔ engine mapping, answer hiding, reveal ───────────── */

/** A row from the `exercises` table (columns the mapper needs). */
export type ExerciseRow = {
  slug: string
  type: Exercise["type"]
  promptKey: string
  data: ExerciseData
}

/** Build the full engine Exercise (with answers) from a DB row. Server-side. */
export function mapExerciseRow(row: ExerciseRow): Exercise {
  const base = { id: row.slug, promptKey: row.promptKey }
  switch (row.type) {
    case "multiple_choice": {
      const d = row.data as MultipleChoiceData
      return { type: "multiple_choice", ...base, word: d.word, options: d.options, correctAnswer: d.correctAnswer }
    }
    case "sort": {
      const d = row.data as SortData
      return { type: "sort", ...base, buckets: d.buckets, items: d.items }
    }
    case "match": {
      const d = row.data as MatchData
      return { type: "match", ...base, left: d.left, right: d.right, solution: d.solution }
    }
    case "speak": {
      const d = row.data as SpeakData
      return { type: "speak", ...base, word: d.word, accept: d.accept }
    }
  }
}

/**
 * Remove the answer fields before sending an Exercise to the client, so correct
 * answers are never shipped up front. The client re-learns them only after
 * checking, via the server's reveal (see ExerciseReveal). Shapes are preserved
 * (fields blanked) so the renderer types don't change.
 */
export function stripExercise(exercise: Exercise): Exercise {
  switch (exercise.type) {
    case "multiple_choice":
      return { ...exercise, correctAnswer: "" }
    case "sort":
      return { ...exercise, items: exercise.items.map((i) => ({ ...i, bucket: "" })) }
    case "match":
      return { ...exercise, solution: {} }
    case "speak":
      return { ...exercise, accept: [] }
  }
}

/** What the server returns after checking, so the UI can highlight answers. */
export type ExerciseReveal = {
  correctAnswer?: string // multiple_choice: correct option id
  correctBuckets?: Record<string, string> // sort: itemId → correct bucketId
  solution?: Record<string, string> // match: leftId → correct rightId
}

export function extractReveal(exercise: Exercise): ExerciseReveal {
  switch (exercise.type) {
    case "multiple_choice":
      return { correctAnswer: exercise.correctAnswer }
    case "sort":
      return { correctBuckets: Object.fromEntries(exercise.items.map((i) => [i.id, i.bucket])) }
    case "match":
      return { solution: exercise.solution }
    case "speak":
      return {}
  }
}

