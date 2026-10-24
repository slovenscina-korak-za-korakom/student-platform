/**
 * Interactive course tests (Duolingo-style exercise engine).
 *
 * A module (section) can host one or more *tests*, each addressed in the URL by
 * its `id`:  /courses/[courseId]/[sectionId]/test/[testId]
 *
 * Content split, per product decision:
 *   - INSTRUCTIONS / prompts / labels -> next-intl keys (translate per locale).
 *     Keys are resolved against the `courses.test` namespace, e.g.
 *     t("lessons.alphabet.selectPronunciation").
 *   - Slovene TARGET material (words, phonetic transcriptions, greetings) is
 *     fixed and lives here as plain strings.
 *
 * This is mock data, mirroring the `getMockSection` pattern. Swap the lookups
 * for real course-actions once the content lives in the database.
 */

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

/* ───────────────────────── Mock content ───────────────────────── */

/**
 * Lesson 1 — "Slovenian alphabet & pronunciation" (from NALOGE ZA VIDEO).
 * Belongs to the first module, "Getting Started" (slug: getting-started).
 */
const alphabetTest: CourseTest = {
  id: "alphabet-and-pronunciation",
  sectionSlug: "getting-started",
  titleKey: "lessons.alphabet.title",
  exercises: [
    // 1) Correct pronunciation
    {
      type: "multiple_choice",
      id: "borovnica",
      promptKey: "lessons.alphabet.selectPronunciation",
      word: "borovnica",
      options: [
        { id: "a", text: "[barounica]" },
        { id: "b", text: "[baravnica]" },
        { id: "c", text: "[borovnica]" },
      ],
      correctAnswer: "c",
    },
    {
      type: "multiple_choice",
      id: "jabolko",
      promptKey: "lessons.alphabet.selectPronunciation",
      word: "jabolko",
      options: [
        { id: "a", text: "[jabouko]" },
        { id: "b", text: "[jabavko]" },
        { id: "c", text: "[jabalko]" },
      ],
      correctAnswer: "a",
    },
    {
      type: "multiple_choice",
      id: "avtobus",
      promptKey: "lessons.alphabet.selectPronunciation",
      word: "avtobus",
      options: [
        { id: "a", text: "[avtobus]" },
        { id: "b", text: "[autabus]" },
        { id: "c", text: "[autobus]" },
      ],
      correctAnswer: "c",
    },
    // 2) Normal [e] vs semivowel [ə]
    // CONTENT NOTE: the bucket assignments below are a best-effort guess and
    // should be verified by a native/teacher before going live.
    {
      type: "sort",
      id: "e-or-schwa",
      promptKey: "lessons.alphabet.eOrSchwa",
      buckets: [
        { id: "normalE", labelKey: "lessons.alphabet.buckets.normalE" },
        { id: "schwa", labelKey: "lessons.alphabet.buckets.schwa" },
      ],
      items: [
        { id: "pes", text: "pes", bucket: "schwa" },
        { id: "sedem", text: "sedem", bucket: "schwa" },
        { id: "dez", text: "dež", bucket: "normalE" },
        { id: "biologija", text: "biologija", bucket: "normalE" },
      ],
    },
    // 3) Say the sounds firmly (mic, skippable)
    {
      type: "speak",
      id: "say-cokolada",
      promptKey: "lessons.alphabet.sayFirmly",
      word: "čokolada",
      accept: ["čokolada", "cokolada"],
    },
    {
      type: "speak",
      id: "say-sport",
      promptKey: "lessons.alphabet.sayFirmly",
      word: "šport",
      accept: ["šport", "sport"],
    },
    {
      type: "speak",
      id: "say-zena",
      promptKey: "lessons.alphabet.sayFirmly",
      word: "žena",
      accept: ["žena", "zena"],
    },
    {
      type: "speak",
      id: "say-student",
      promptKey: "lessons.alphabet.sayFirmly",
      word: "študent",
      accept: ["študent", "student"],
    },
    {
      type: "speak",
      id: "say-zivijo",
      promptKey: "lessons.alphabet.sayFirmly",
      word: "živijo",
      accept: ["živijo", "zivijo", "živjo", "zivjo"],
    },
    // 4) Sort the letters: vowels vs consonants
    {
      type: "sort",
      id: "vowels-consonants",
      promptKey: "lessons.alphabet.sortLetters",
      buckets: [
        { id: "vowels", labelKey: "lessons.alphabet.buckets.vowels" },
        { id: "consonants", labelKey: "lessons.alphabet.buckets.consonants" },
      ],
      items: [
        { id: "A", text: "A", bucket: "vowels" },
        { id: "C", text: "Č", bucket: "consonants" },
        { id: "O", text: "O", bucket: "vowels" },
        { id: "U", text: "U", bucket: "vowels" },
        { id: "S", text: "Š", bucket: "consonants" },
        { id: "M", text: "M", bucket: "consonants" },
        { id: "E", text: "E", bucket: "vowels" },
        { id: "Z", text: "Ž", bucket: "consonants" },
        { id: "I", text: "I", bucket: "vowels" },
        { id: "T", text: "T", bucket: "consonants" },
      ],
    },
    // 5) Match the situation to the right greeting / farewell
    {
      type: "match",
      id: "greetings",
      promptKey: "lessons.alphabet.matchGreetings",
      left: [
        { id: "s1", promptKey: "lessons.alphabet.situations.morning" },
        { id: "s2", promptKey: "lessons.alphabet.situations.friendBye" },
        { id: "s3", promptKey: "lessons.alphabet.situations.email" },
        { id: "s4", promptKey: "lessons.alphabet.situations.friendStreet" },
        { id: "s5", promptKey: "lessons.alphabet.situations.workBye" },
      ],
      right: [
        { id: "g1", text: "Dobro jutro" },
        { id: "g2", text: "Čao" },
        { id: "g3", text: "Lep pozdrav" },
        { id: "g4", text: "Živijo" },
        { id: "g5", text: "Nasvidenje" },
      ],
      solution: { s1: "g1", s2: "g2", s3: "g3", s4: "g4", s5: "g5" },
    },
  ],
}

const allTests: CourseTest[] = [alphabetTest]

/** Tests belonging to a given module (section) slug. */
export function getTestsForSection(sectionSlug: string): CourseTest[] {
  return allTests.filter((t) => t.sectionSlug === sectionSlug)
}

/** Look up a single test by section slug + test id (used by the test route). */
export function getTest(sectionSlug: string, testId: string): CourseTest | undefined {
  return allTests.find((t) => t.sectionSlug === sectionSlug && t.id === testId)
}
