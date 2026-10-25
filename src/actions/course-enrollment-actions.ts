"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { getTranslations } from "next-intl/server"
import { db } from "@/db"
import { coursesTable, courseEnrollmentsTable } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import Stripe from "stripe"
import { currencyForLocale, hasCourseAccess } from "@/lib/course-access"

/**
 * Course paywall — checkout + enrollment. One-time per-course purchase; a paid
 * checkout.session.completed (webhook) or a confirmed redirect
 * (confirmCourseCheckout) upserts an active `course_enrollments` row. Mirrors the
 * lang_club Stripe patterns in `stripe-actions.ts`. See docs/courses-paywall-plan.md.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
})

type Locale = "en" | "it" | "sl" | "ru"

/** Idempotent upsert of an active enrollment (unique on user+course). */
async function upsertActiveEnrollment(args: {
  userId: string
  courseId: number
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
}) {
  await db
    .insert(courseEnrollmentsTable)
    .values({
      userId: args.userId,
      courseId: args.courseId,
      status: "active",
      source: "stripe",
      stripeSessionId: args.stripeSessionId ?? null,
      stripePaymentIntentId: args.stripePaymentIntentId ?? null,
      expiresAt: null, // lifetime access
    })
    .onConflictDoUpdate({
      target: [courseEnrollmentsTable.userId, courseEnrollmentsTable.courseId],
      set: {
        status: "active",
        source: "stripe",
        stripeSessionId: args.stripeSessionId ?? null,
        stripePaymentIntentId: args.stripePaymentIntentId ?? null,
      },
    })
}

/**
 * Create a Stripe Checkout session to buy a course. Returns the hosted checkout
 * URL. The enrollment is created later (webhook / confirmCourseCheckout).
 */
export const createCourseCheckoutSession = async (courseSlug: string, locale: Locale) => {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized", status: 401 }

  const course = await db.query.coursesTable.findFirst({
    where: eq(coursesTable.slug, courseSlug),
    columns: {
      id: true,
      slug: true,
      titleKey: true,
      stripePriceId: true,
      priceByCurrency: true,
    },
  })
  if (!course) return { error: "Course not found", status: 404 }
  if (!course.stripePriceId) {
    return { error: "This course is free — no purchase needed", status: 400 }
  }

  if (await hasCourseAccess(userId, course.id)) {
    return { error: "You already have access to this course", status: 400 }
  }

  // Prefill the buyer's email from Clerk so they don't retype it.
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress

  // Localized course title + checkout copy (brand touches on the Stripe page).
  const t = await getTranslations({ locale, namespace: "courses" })
  const courseTitle = t.has(course.titleKey) ? t(course.titleKey) : course.slug

  // Present the locale's currency only if the Price actually carries it; else
  // let Stripe choose (EUR default) so we never pass an unsupported currency.
  const preferred = currencyForLocale(locale)
  const supported = course.priceByCurrency ?? {}
  const currency = supported[preferred] != null ? preferred : undefined

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "paypal"],
      locale,
      submit_type: "pay",
      ...(currency ? { currency } : {}),
      ...(email ? { customer_email: email } : {}),
      line_items: [{ price: course.stripePriceId, quantity: 1 }],
      // Let buyers apply promo codes created in the Stripe Dashboard.
      allow_promotion_codes: true,
      // TODO: once the Terms of Service URL is set in the Stripe Dashboard
      // (Settings → Payments → Checkout), add a required terms-acceptance
      // checkbox here: `consent_collection: { terms_of_service: "required" }`
      // (optionally with custom_text.terms_of_service_acceptance). Enabling it
      // before the URL is configured makes Stripe reject the session.
      // Reassurance line shown above the pay button.
      custom_text: {
        submit: { message: t("paywall.checkoutSubmitMessage") },
      },
      // Generate a branded invoice (uses the account's Dashboard branding).
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: courseTitle,
          footer: t("paywall.invoiceFooter"),
          metadata: { courseId: course.id.toString(), slug: course.slug },
        },
      },
      // Human-readable description on the PaymentIntent (shows in the Dashboard).
      payment_intent_data: {
        description: `${courseTitle} — ${t("paywall.lifetimeAccess")}`,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/courses/${course.slug}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/courses/${course.slug}?canceled=true`,
      metadata: {
        type: "course",
        courseId: course.id.toString(),
        userId,
      },
    })
    return { url: session.url, sessionId: session.id }
  } catch (error) {
    console.error("Error creating course checkout session:", error)
    return { error: "Internal server error", status: 500 }
  }
}

/**
 * Confirm a completed checkout on redirect and grant access immediately, without
 * waiting for the webhook. Verifies the session is paid and belongs to the
 * current user, then upserts the enrollment (idempotent with the webhook).
 */
export const confirmCourseCheckout = async (sessionId: string) => {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized", status: 401 }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.metadata?.type !== "course") {
      return { error: "Not a course checkout", status: 400 }
    }
    if (session.metadata?.userId !== userId) {
      return { error: "This checkout belongs to another account", status: 403 }
    }
    if (session.payment_status !== "paid") {
      return { ok: false, pending: true as const }
    }

    const courseId = parseInt(session.metadata?.courseId || "0", 10)
    if (!courseId) return { error: "Missing course", status: 400 }

    await upsertActiveEnrollment({
      userId,
      courseId,
      stripeSessionId: session.id,
      stripePaymentIntentId: (session.payment_intent as string) ?? null,
    })

    return { ok: true as const }
  } catch (error) {
    console.error("Error confirming course checkout:", error)
    return { error: "Internal server error", status: 500 }
  }
}

/**
 * Grant a free (source='free') enrollment for a price-less course. Not needed
 * for read access (free courses are open by the access predicate) but available
 * for explicit "enroll in free course" flows or backfills.
 */
export const ensureFreeEnrollment = async (courseId: number) => {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized", status: 401 }

  const existing = await db.query.courseEnrollmentsTable.findFirst({
    where: and(
      eq(courseEnrollmentsTable.userId, userId),
      eq(courseEnrollmentsTable.courseId, courseId)
    ),
    columns: { id: true },
  })
  if (existing) return { ok: true as const }

  await db
    .insert(courseEnrollmentsTable)
    .values({ userId, courseId, status: "active", source: "free", expiresAt: null })
    .onConflictDoNothing({
      target: [courseEnrollmentsTable.userId, courseEnrollmentsTable.courseId],
    })
  return { ok: true as const }
}
