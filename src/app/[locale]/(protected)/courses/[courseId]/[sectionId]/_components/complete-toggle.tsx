"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { IconCheck, IconCircle } from "@tabler/icons-react"
import { markItemComplete } from "@/actions/progress-actions"

/** Marks a module item complete (per-user). Once done it can't be undone here. */
const CompleteToggle = ({ itemId, completed }: { itemId: number; completed: boolean }) => {
  const t = useTranslations("courses.test")
  const [done, setDone] = useState(completed)
  const [pending, start] = useTransition()

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
        <IconCheck className="h-4 w-4" />
        {t("items.completed")}
      </span>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => {
        await markItemComplete(itemId)
        setDone(true)
      })}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      <IconCircle className="h-4 w-4" />
      {t("items.markComplete")}
    </button>
  )
}

export default CompleteToggle
