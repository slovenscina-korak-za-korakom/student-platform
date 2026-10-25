"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { and, eq } from "drizzle-orm"
import {
  modulesTable,
  courseTestsTable,
  exercisesTable,
  moduleItemsTable,
  moduleItemProgressTable,
  testAttemptsTable,
  type TestAttemptAnswers,
  type TestItemData,
} from "@/db/schema"
import {
  mapExerciseRow,
  gradeExercise,
  extractReveal,
  emptyDraft,
  type ExerciseDraft,
  type ExerciseReveal,
} from "@/lib/course-exercises"

/**
 * Progress + grading writes. Grading is authoritative here: the server loads the
 * real answers from the DB and never trusts client-claimed correctness. Exercises
 * reach the client with answers stripped (see course-actions), so grading must
 * round-trip through `checkExercise` / `recordTestAttempt`.
 *
 * Note: module_item_progress has no DB unique(userId, moduleItemId) yet, so we
 * upsert by select-then-write (small race window, acceptable).
 */

/* ───────────────────────── internal helpers ───────────────────────── */

async function resolveTestId(moduleSlug: string, testSlug: string) {
  const m = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.slug, moduleSlug),
    columns: { id: true },
  })
  if (!m) return null
  const tst = await db.query.courseTestsTable.findFirst({
    where: and(eq(courseTestsTable.moduleId, m.id), eq(courseTestsTable.slug, testSlug)),
    columns: { id: true, passThreshold: true },
  })
  return tst ? { moduleId: m.id, testId: tst.id, passThreshold: tst.passThreshold } : null
}

async function upsertProgress(
  userId: string,
  moduleItemId: number,
  patch: { completed?: boolean; completedAt?: Date | null; lastPositionSec?: number }
) {
  const [existing] = await db
    .select({ id: moduleItemProgressTable.id })
    .from(moduleItemProgressTable)
    .where(
      and(
        eq(moduleItemProgressTable.userId, userId),
        eq(moduleItemProgressTable.moduleItemId, moduleItemId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(moduleItemProgressTable)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(moduleItemProgressTable.id, existing.id))
  } else {
    await db.insert(moduleItemProgressTable).values({ userId, moduleItemId, ...patch })
  }
}

/** Find the `test` module_item in a module that points at the given test. */
async function findTestItemId(moduleId: number, testId: number) {
  const items = await db
    .select({ id: moduleItemsTable.id, data: moduleItemsTable.data })
    .from(moduleItemsTable)
    .where(and(eq(moduleItemsTable.moduleId, moduleId), eq(moduleItemsTable.type, "test")))
  const match = items.find((it) => (it.data as TestItemData)?.testId === testId)
  return match?.id ?? null
}

/* ───────────────────────── exercise grading ───────────────────────── */

/** Grade one exercise (for immediate feedback) and reveal the correct answer. */
export async function checkExercise(
  moduleSlug: string,
  testSlug: string,
  exerciseSlug: string,
  given: ExerciseDraft
): Promise<{ correct: boolean; reveal: ExerciseReveal }> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const resolved = await resolveTestId(moduleSlug, testSlug)
  if (!resolved) throw new Error("Test not found")

  const row = await db.query.exercisesTable.findFirst({
    where: and(
      eq(exercisesTable.testId, resolved.testId),
      eq(exercisesTable.slug, exerciseSlug)
    ),
  })
  if (!row) throw new Error("Exercise not found")

  const exercise = mapExerciseRow(row)
  return { correct: gradeExercise(exercise, given), reveal: extractReveal(exercise) }
}

/* ───────────────────────── attempts + progress ───────────────────────── */

/** Record a full test attempt — re-graded server-side — and mark it complete. */
export async function recordTestAttempt(
  moduleSlug: string,
  testSlug: string,
  answers: { exerciseSlug: string; given: ExerciseDraft }[]
): Promise<{ score: number; total: number; passed: boolean } | null> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const resolved = await resolveTestId(moduleSlug, testSlug)
  if (!resolved) return null

  const rows = await db.query.exercisesTable.findMany({
    where: eq(exercisesTable.testId, resolved.testId),
    orderBy: (e, { asc }) => [asc(e.order)],
  })

  const givenBySlug = new Map(answers.map((a) => [a.exerciseSlug, a.given]))
  const graded: TestAttemptAnswers = []
  let score = 0
  for (const row of rows) {
    const exercise = mapExerciseRow(row)
    const given = givenBySlug.has(row.slug)
      ? (givenBySlug.get(row.slug) as ExerciseDraft)
      : emptyDraft(exercise)
    const correct = gradeExercise(exercise, given)
    if (correct) score += 1
    graded.push({ exerciseSlug: row.slug, correct, given })
  }

  const total = rows.length
  const pct = total > 0 ? (score / total) * 100 : 0
  const passed = resolved.passThreshold != null ? pct >= resolved.passThreshold : true

  await db.insert(testAttemptsTable).values({
    userId,
    testId: resolved.testId,
    score,
    total,
    passed,
    answers: graded,
  })

  // Finishing the test completes its module item.
  const itemId = await findTestItemId(resolved.moduleId, resolved.testId)
  if (itemId) await upsertProgress(userId, itemId, { completed: true, completedAt: new Date() })

  return { score, total, passed }
}

/** Mark any module item complete (e.g. a PDF read, a text read). */
export async function markItemComplete(moduleItemId: number): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  await upsertProgress(userId, moduleItemId, { completed: true, completedAt: new Date() })
}

/** Store a video's resume position; mark complete when `completed` is passed. */
export async function saveVideoPosition(
  moduleItemId: number,
  seconds: number,
  completed = false
): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  await upsertProgress(userId, moduleItemId, {
    lastPositionSec: Math.max(0, Math.floor(seconds)),
    ...(completed ? { completed: true, completedAt: new Date() } : {}),
  })
}
