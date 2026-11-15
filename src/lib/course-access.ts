import { db } from "@/db"
import { courseEnrollmentsTable, type PriceByCurrency } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"

/**
 * Course paywall access helpers. The access predicate (see
 * docs/courses-paywall-plan.md): a user may open a course if it is free
 * (no Stripe price) OR they hold an active, non-expired enrollment. The first
 * module of a paid course is a free preview — that exception is applied by the
 * callers that know a module's position, not here.
 */

export type Currency = "eur" | "usd" | "rub"

/* ───────────────────────── Early-access beta gate ─────────────────────────
 * Before the public launch, courses are hidden behind the COURSES_AVAILABLE
 * flag. A short allowlist of test users (COURSES_BETA_EMAILS, comma-separated)
 * gets in early: they bypass BOTH the availability gate (the "coming soon"
 * pages) AND the paywall, so they can exercise every course/module in full.
 * Once COURSES_AVAILABLE=true for everyone, the allowlist is harmless; emptying
 * the env var removes all overhead (no Clerk lookup). */

/** Lowercased set of emails granted early course access. Empty when unset. */
function betaEmailSet(): Set<string> {
  return new Set(
    (process.env.COURSES_BETA_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  )
}

/** True when courses are publicly launched for everyone. */
export function coursesPubliclyAvailable(): boolean {
  return process.env.COURSES_AVAILABLE === "true"
}

/**
 * True if the signed-in user is on the course beta allowlist. Matches the
 * Clerk user's primary email first, then any of their verified emails. Returns
 * false immediately (no Clerk call) when the allowlist is empty.
 */
export async function isCoursesBetaTester(): Promise<boolean> {
  const emails = betaEmailSet()
  if (emails.size === 0) return false
  const user = await currentUser()
  if (!user) return false
  return user.emailAddresses.some((e) => emails.has(e.emailAddress.toLowerCase()))
}

/** Courses open to the current request: public launch OR an allowlisted tester. */
export async function coursesAvailableForCurrentUser(): Promise<boolean> {
  return coursesPubliclyAvailable() || (await isCoursesBetaTester())
}

/** Preferred presentment currency for a locale (EUR is the base/fallback). */
export function currencyForLocale(locale: string): Currency {
  switch (locale) {
    case "en":
      return "usd"
    case "ru":
      return "rub"
    default:
      return "eur" // sl, it, and any unknown locale
  }
}

/** True if the user holds an active, non-expired enrollment for the course. */
export async function hasCourseAccess(
  userId: string | null | undefined,
  courseId: number
): Promise<boolean> {
  if (!userId) return false
  // Beta testers get full access regardless of enrollment/paywall.
  if (await isCoursesBetaTester()) return true
  const row = await db.query.courseEnrollmentsTable.findFirst({
    where: and(
      eq(courseEnrollmentsTable.userId, userId),
      eq(courseEnrollmentsTable.courseId, courseId),
      eq(courseEnrollmentsTable.status, "active")
    ),
    columns: { id: true, expiresAt: true },
  })
  if (!row) return false
  return !(row.expiresAt && row.expiresAt.getTime() <= Date.now());

}

/** All course ids the user has active access to (one query, avoids N+1 on lists). */
export async function getAccessibleCourseIds(
  userId: string | null | undefined
): Promise<Set<number>> {
  if (!userId) return new Set()
  const rows = await db.query.courseEnrollmentsTable.findMany({
    where: and(
      eq(courseEnrollmentsTable.userId, userId),
      eq(courseEnrollmentsTable.status, "active")
    ),
    columns: { courseId: true, expiresAt: true },
  })
  const now = Date.now()
  return new Set(
    rows.filter((r) => !r.expiresAt || r.expiresAt.getTime() > now).map((r) => r.courseId)
  )
}

/** Display price (minor units) for a locale, falling back to EUR then anything. */
export function pickDisplayPrice(
  priceByCurrency: PriceByCurrency | null | undefined,
  locale: string
): { currency: Currency; amount: number } | null {
  if (!priceByCurrency) return null
  const pref = currencyForLocale(locale)
  if (priceByCurrency[pref] != null) return { currency: pref, amount: priceByCurrency[pref]! }
  if (priceByCurrency.eur != null) return { currency: "eur", amount: priceByCurrency.eur }
  const entries = Object.entries(priceByCurrency) as [Currency, number][]
  return entries.length ? { currency: entries[0][0], amount: entries[0][1] } : null
}

/** Localized currency string from minor units, e.g. 4900 → "€49.00". */
export function formatPrice(amount: number, currency: Currency, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

/** Convenience: resolved, formatted display price for a course row. */
export function courseDisplayPrice(
  priceByCurrency: PriceByCurrency | null | undefined,
  locale: string
): { currency: Currency; amount: number; formatted: string } | null {
  const picked = pickDisplayPrice(priceByCurrency, locale)
  if (!picked) return null
  return { ...picked, formatted: formatPrice(picked.amount, picked.currency, locale) }
}
