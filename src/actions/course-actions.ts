"use server"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { getTranslations } from "next-intl/server"
import { and, eq, inArray } from "drizzle-orm"
import {
  coursesTable,
  modulesTable,
  courseTestsTable,
  moduleItemsTable,
  moduleItemProgressTable,
  type VideoItemData,
  type ModuleItemData,
  type PdfItemData,
  type TextItemData,
  type LinkItemData,
  type TestItemData,
} from "@/db/schema"
import { mapExerciseRow, stripExercise, type CourseTest } from "@/lib/course-exercises"
import {
  courseDisplayPrice,
  getAccessibleCourseIds,
  hasCourseAccess,
} from "@/lib/course-access"

/**
 * DB read layer for courses. Display text is stored as i18n keys
 * (`titleKey`/`descriptionKey`, resolved under the `courses.content` tree);
 * we resolve them here, falling back to the deprecated `title`/`description`
 * columns while those still exist. URLs use the stored
 * `slug`. Exercises are stripped of their answers before leaving the server
 * (grading happens in `progress-actions`).
 */

type Resolver = (key: string | null | undefined, fallback: string | null) => string | null

async function makeResolver(locale: string): Promise<Resolver> {
  const t = await getTranslations({ locale })
  return (key, fallback) => {
    if (key && t.has(key)) return t(key)
    return fallback
  }
}

/* ───────────────────────── Courses list ───────────────────────── */

export const getCoursesList = async (locale: string) => {
  const resolve = await makeResolver(locale)
  const { userId } = await auth()
  const rows = await db.query.coursesTable.findMany({
    orderBy: (c, { asc }) => [asc(c.order)],
    with: {
      modules: {
        columns: { id: true },
        with: { items: { columns: { id: true } } },
      },
    },
  })

  const accessible = await getAccessibleCourseIds(userId)

  return rows.map((c) => {
    const isFree = !c.stripePriceId
    const enrolled = isFree || accessible.has(c.id)
    return {
      ...c,
      title: resolve(c.titleKey, c.titleKey) ?? c.titleKey,
      description: resolve(c.descriptionKey, null),
      sections: c.modules.length,
      lessons: c.modules.reduce((sum, m) => sum + m.items.length, 0),
      isFree,
      enrolled,
      locked: !enrolled,
      price: courseDisplayPrice(c.priceByCurrency, locale),
    }
  })
}

/* ───────────────────────── Single course ───────────────────────── */

export const getCourseBySlug = async (slug: string, locale: string) => {
  const resolve = await makeResolver(locale)
  const { userId } = await auth()
  const c = await db.query.coursesTable.findFirst({
    where: eq(coursesTable.slug, slug),
    with: {
      modules: {
        orderBy: (m, { asc }) => [asc(m.order)],
        with: {
          items: { columns: { id: true } },
        },
      },
    },
  })
  if (!c) return null

  // Per-user module completion: finished when it has items and the user has
  // completed all of them.
  const allItemIds = c.modules.flatMap((m) => m.items.map((i) => i.id))
  let completed = new Set<number>()
  if (userId && allItemIds.length > 0) {
    const done = await db
      .select({ id: moduleItemProgressTable.moduleItemId })
      .from(moduleItemProgressTable)
      .where(
        and(
          eq(moduleItemProgressTable.userId, userId),
          eq(moduleItemProgressTable.completed, true),
          inArray(moduleItemProgressTable.moduleItemId, allItemIds)
        )
      )
    completed = new Set(done.map((d) => d.id))
  }

  // Paywall state. `c.modules` is ordered by `order` asc, so the first entry is
  // the free-preview module. A module is locked only when the course is paid,
  // the user isn't enrolled, and it isn't the preview module.
  const isFree = !c.stripePriceId
  const enrolled = isFree || (await hasCourseAccess(userId, c.id))
  const previewModuleId = c.modules[0]?.id ?? null

  return {
    ...c,
    title: resolve(c.titleKey, c.titleKey) ?? c.titleKey,
    description: resolve(c.descriptionKey, null),
    isFree,
    enrolled,
    locked: !enrolled,
    price: courseDisplayPrice(c.priceByCurrency, locale),
    // Components consume `sections` (module rows with resolved text + computed completion).
    sections: c.modules.map((m) => {
      const itemIds = m.items.map((i) => i.id)
      const isPreview = m.id === previewModuleId
      return {
        ...m,
        title: resolve(m.titleKey, m.titleKey) ?? m.titleKey,
        description: resolve(m.descriptionKey, null),
        itemCount: itemIds.length,
        isFinished: itemIds.length > 0 && itemIds.every((id) => completed.has(id)),
        isPreview,
        locked: !enrolled && !isPreview,
      }
    }),
    lessonCount: c.modules.reduce((sum, m) => sum + m.items.length, 0),
  }
}

/* ───────────────────────── Single module (content) ───────────────────────── */

/** A module content item, resolved for rendering + per-user completion. */
export type ModuleItemVM = {
  id: number
  type: "video" | "pdf" | "test" | "text" | "link"
  order: number
  title: string | null
  completed: boolean
  video?: {
    provider: "youtube" | "s3hls"
    url?: string // youtube only — never present for s3hls (no plain source URL)
    status?: "processing" | "ready" // s3hls only
    durationSec: number | null
    lastPositionSec: number | null
  }
  pdf?: { assetId: string }
  text?: { body: string }
  link?: { url: string }
  test?: { slug: string; title: string | null; exerciseCount: number } | null
}

export type ModuleContentVM = {
  id: number
  slug: string
  title: string
  description: string | null
  course: { slug: string; title: string }
  items: ModuleItemVM[]
}

/** Locked sentinel returned when the user may not open a paid module. */
export type ModuleLocked = { locked: true; courseSlug: string }

export type ModuleAccess =
  | { state: "notfound" }
  | { state: "locked"; courseSlug: string }
  | { state: "ok"; courseId: number; moduleId: number }

/**
 * Resolve whether the current user may open (courseSlug, moduleSlug): free
 * course or active enrollment → open; otherwise only the first (lowest-order)
 * module is a free preview. Shared by the module page and the test page.
 */
export const resolveModuleAccess = async (
  courseSlug: string,
  moduleSlug: string
): Promise<ModuleAccess> => {
  const { userId } = await auth()

  const course = await db.query.coursesTable.findFirst({
    where: eq(coursesTable.slug, courseSlug),
    columns: { id: true, stripePriceId: true },
  })
  if (!course) return { state: "notfound" }

  const m = await db.query.modulesTable.findFirst({
    where: and(eq(modulesTable.courseId, course.id), eq(modulesTable.slug, moduleSlug)),
    columns: { id: true },
  })
  if (!m) return { state: "notfound" }

  const isFree = !course.stripePriceId
  if (isFree || (await hasCourseAccess(userId, course.id))) {
    return { state: "ok", courseId: course.id, moduleId: m.id }
  }

  // Not enrolled: allow only the free-preview (lowest-order) module.
  const preview = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.courseId, course.id),
    orderBy: (mm, { asc }) => [asc(mm.order)],
    columns: { id: true },
  })
  if (preview?.id === m.id) return { state: "ok", courseId: course.id, moduleId: m.id }

  return { state: "locked", courseSlug }
}

export type ItemAccess =
  | { state: "notfound" }
  | { state: "locked" }
  | { state: "ok"; courseId: number; type: ModuleItemVM["type"]; data: ModuleItemData }

/**
 * Enrollment gate for a single module item, by id — the predicate behind the
 * video serving routes (manifest + key). Same rule as `resolveModuleAccess`:
 * free course OR active enrollment OR the item sits in the first (lowest-order)
 * module, which is a free preview. Resolves item → module → course in-line
 * because callers only hold a moduleItemId. On `ok` it returns the item's
 * `data` so the route can read the s3hls `assetKey` without a second query.
 */
export const resolveItemAccess = async (moduleItemId: number): Promise<ItemAccess> => {
  const { userId } = await auth()

  const item = await db.query.moduleItemsTable.findFirst({
    where: eq(moduleItemsTable.id, moduleItemId),
    columns: { id: true, type: true, data: true, moduleId: true },
  })
  if (!item) return { state: "notfound" }

  const mod = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.id, item.moduleId),
    columns: { id: true, courseId: true },
  })
  if (!mod) return { state: "notfound" }

  const course = await db.query.coursesTable.findFirst({
    where: eq(coursesTable.id, mod.courseId),
    columns: { id: true, stripePriceId: true },
  })
  if (!course) return { state: "notfound" }

  const ok = { state: "ok" as const, courseId: course.id, type: item.type, data: item.data }

  const isFree = !course.stripePriceId
  if (isFree || (await hasCourseAccess(userId, course.id))) return ok

  // Not enrolled: allow only if this item lives in the free-preview module.
  const preview = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.courseId, course.id),
    orderBy: (mm, { asc }) => [asc(mm.order)],
    columns: { id: true },
  })
  if (preview?.id === mod.id) return ok

  return { state: "locked" }
}

export const getModuleContent = async (
  courseSlug: string,
  moduleSlug: string,
  locale: string
): Promise<ModuleContentVM | ModuleLocked | null> => {
  const resolve = await makeResolver(locale)
  const { userId } = await auth()

  const access = await resolveModuleAccess(courseSlug, moduleSlug)
  if (access.state === "notfound") return null
  if (access.state === "locked") return { locked: true, courseSlug: access.courseSlug }

  const course = await db.query.coursesTable.findFirst({
    where: eq(coursesTable.slug, courseSlug),
    columns: { id: true, slug: true, titleKey: true },
  })
  if (!course) return null

  const m = await db.query.modulesTable.findFirst({
    where: and(eq(modulesTable.courseId, course.id), eq(modulesTable.slug, moduleSlug)),
    with: { items: { orderBy: (i, { asc }) => [asc(i.order)] } },
  })
  if (!m) return null

  // Per-user progress for these items.
  const itemIds = m.items.map((i) => i.id)
  const progress = new Map<number, { completed: boolean; lastPositionSec: number | null }>()
  if (userId && itemIds.length > 0) {
    const rows = await db
      .select({
        itemId: moduleItemProgressTable.moduleItemId,
        completed: moduleItemProgressTable.completed,
        lastPositionSec: moduleItemProgressTable.lastPositionSec,
      })
      .from(moduleItemProgressTable)
      .where(
        and(
          eq(moduleItemProgressTable.userId, userId),
          inArray(moduleItemProgressTable.moduleItemId, itemIds)
        )
      )
    for (const r of rows) progress.set(r.itemId, { completed: r.completed, lastPositionSec: r.lastPositionSec })
  }

  // Resolve `test` items → launcher metadata (slug, title, exercise count).
  const testIds = m.items
    .filter((i) => i.type === "test")
    .map((i) => (i.data as TestItemData).testId)
  const tests = new Map<number, { slug: string; titleKey: string; count: number }>()
  if (testIds.length > 0) {
    const rows = await db.query.courseTestsTable.findMany({
      where: inArray(courseTestsTable.id, testIds),
      with: { exercises: { columns: { id: true } } },
    })
    for (const t of rows) tests.set(t.id, { slug: t.slug, titleKey: t.titleKey, count: t.exercises.length })
  }

  const items: ModuleItemVM[] = m.items.map((it) => {
    const prog = progress.get(it.id)
    const common = {
      id: it.id,
      type: it.type,
      order: it.order,
      title: resolve(it.titleKey, null),
      completed: prog?.completed ?? false,
    }
    switch (it.type) {
      case "video": {
        const d = it.data as VideoItemData
        const base = { durationSec: d.durationSec ?? null, lastPositionSec: prog?.lastPositionSec ?? null }
        return {
          ...common,
          video:
            d.provider === "s3hls"
              ? { provider: "s3hls" as const, status: d.status ?? "processing", ...base }
              : { provider: "youtube" as const, url: d.url, ...base },
        }
      }
      case "pdf":
        return { ...common, pdf: { assetId: (it.data as PdfItemData).assetId } }
      case "text":
        return { ...common, text: { body: resolve((it.data as TextItemData).bodyKey, "") ?? "" } }
      case "link":
        return { ...common, link: { url: (it.data as LinkItemData).url } }
      case "test": {
        const t = tests.get((it.data as TestItemData).testId)
        return { ...common, test: t ? { slug: t.slug, title: resolve(t.titleKey, null), exerciseCount: t.count } : null }
      }
    }
  })

  return {
    id: m.id,
    slug: m.slug,
    title: resolve(m.titleKey, m.titleKey) ?? m.titleKey,
    description: resolve(m.descriptionKey, null),
    course: {
      slug: course.slug,
      title: resolve(course.titleKey, course.titleKey) ?? course.titleKey,
    },
    items,
  }
}

/** A single test by module slug + test slug, for the test page. */
export const getTestBySlug = async (
  moduleSlug: string,
  testSlug: string
): Promise<CourseTest | null> => {
  const m = await db.query.modulesTable.findFirst({
    where: eq(modulesTable.slug, moduleSlug),
    columns: { id: true },
  })
  if (!m) return null

  const tst = await db.query.courseTestsTable.findFirst({
    where: and(eq(courseTestsTable.moduleId, m.id), eq(courseTestsTable.slug, testSlug)),
    with: { exercises: { orderBy: (e, { asc }) => [asc(e.order)] } },
  })
  if (!tst) return null

  return {
    id: tst.slug,
    sectionSlug: moduleSlug,
    titleKey: tst.titleKey,
    exercises: tst.exercises.map((e) => stripExercise(mapExerciseRow(e))),
  }
}
