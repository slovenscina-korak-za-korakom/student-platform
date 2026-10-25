"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { confirmCourseCheckout } from "@/actions/course-enrollment-actions"

/**
 * Handles the Stripe Checkout return on the course page. On `?success`, confirms
 * the session server-side (granting access immediately, ahead of the webhook),
 * refreshes the page, and clears the query string. On `?canceled`, just notifies.
 */
const PurchaseStatus = () => {
  const t = useTranslations("courses")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return

    const success = params.get("success")
    const canceled = params.get("canceled")
    const sessionId = params.get("session_id")

    if (success === "true" && sessionId) {
      handled.current = true
      ;(async () => {
        const res = await confirmCourseCheckout(sessionId)
        if ("ok" in res && res.ok) {
          toast.success(t("paywall.success"))
          router.replace(pathname)
          router.refresh()
        } else if ("pending" in res && res.pending) {
          toast.info(t("paywall.processing"))
          router.replace(pathname)
        } else {
          toast.error(("error" in res && res.error) || t("paywall.checkoutError"))
          router.replace(pathname)
        }
      })()
    } else if (canceled === "true") {
      handled.current = true
      toast.info(t("paywall.canceled"))
      router.replace(pathname)
    }
  }, [params, pathname, router, t])

  return null
}

export default PurchaseStatus
