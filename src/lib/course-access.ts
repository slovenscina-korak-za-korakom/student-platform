import { db } from "@/db"
import { courseEnrollmentsTable, type PriceByCurrency } from "@/db/schema"
import { and, eq } from "drizzle-orm"

/**
 * Course paywall access helpers. The access predicate (see
 * docs/courses-paywall-plan.md): a user may open a course if it is free
 * (no Stripe price) OR they hold an active, non-expired enrollment. The first
 * module of a paid course is a free preview — that exception is applied by the
 * callers that know a module's position, not here.
 */

export type Currency = "eur" | "usd" | "rub"

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
