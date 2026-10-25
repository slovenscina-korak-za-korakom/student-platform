"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { IconLock, IconLoader2 } from "@tabler/icons-react"
import { createCourseCheckoutSession } from "@/actions/course-enrollment-actions"

type Locale = "en" | "it" | "sl" | "ru"

type Props = {
  courseSlug: string
  locale: Locale
  label: string
  className?: string
}

/** Starts Stripe Checkout for a course and redirects to the hosted page. */
const EnrollButton = ({ courseSlug, locale, label, className }: Props) => {
  const t = useTranslations("courses")
  const [pending, startTransition] = useTransition()
  const [redirecting, setRedirecting] = useState(false)

  const onClick = () => {
    startTransition(async () => {
      const res = await createCourseCheckoutSession(courseSlug, locale)
      if ("url" in res && res.url) {
        setRedirecting(true)
        window.location.href = res.url
        return
      }
      toast.error(("error" in res && res.error) || t("paywall.checkoutError"))
    })
  }

  const busy = pending || redirecting

  return (
    <Button onClick={onClick} disabled={busy} className={className}>
      {busy ? (
        <IconLoader2 className="h-4 w-4 animate-spin" />
      ) : (
        <IconLock className="h-4 w-4" />
      )}
      {label}
    </Button>
  )
}

export default EnrollButton
