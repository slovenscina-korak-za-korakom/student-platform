import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  IconBook,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconLock,
  IconPlayerPlay,
  IconSparkles,
  IconVideo,
} from "@tabler/icons-react"
import { cn, slugify } from "@/lib/utils"
import { InferSelectModel } from "drizzle-orm"
import { coursesTable, modulesTable } from "@/db/schema"
import EnrollButton from "./enroll-button"
import PurchaseStatus from "./purchase-status"

type CourseWithContent = InferSelectModel<typeof coursesTable> & {
  // Resolved from i18n keys by course-actions (DB no longer stores plain text).
  title: string
  description: string | null
  // Paywall state (course-actions).
  isFree: boolean
  enrolled: boolean
  locked: boolean
  price: { currency: string; amount: number; formatted: string } | null
  sections: (InferSelectModel<typeof modulesTable> & {
    title: string
    description: string | null
    isFinished: boolean
    itemCount: number
    isPreview: boolean
    locked: boolean
  })[]
  lessonCount: number
}

type Props = {
  course: CourseWithContent
  locale: string
}

const CourseContent = async ({ course, locale }: Props) => {
  const t = await getTranslations("courses")
  const finishedCount = course.sections.filter((s) => s.isFinished).length
  const progress = course.sections.length
    ? Math.round((finishedCount / course.sections.length) * 100)
    : 0
  const courseHref = course.slug ?? slugify(course.title)

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-8 lg:p-10 space-y-8">
      <Suspense fallback={null}>
        <PurchaseStatus />
      </Suspense>

      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href={`/${locale}/courses`}>
          <IconChevronLeft className="h-4 w-4" />
          {t("paywall.coursesBack")}
        </Link>
      </Button>

      {/* ── Course hero ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px] md:gap-8">
        <div className="flex flex-col justify-center space-y-4 order-2 md:order-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-sl-purple to-sl-pink text-white uppercase font-black tracking-wide border-0"
            >
              {course.level}
            </Badge>
            {course.status === "upcoming" && (
              <Badge variant="outline" className="text-xs">
                {t("paywall.comingSoon")}
              </Badge>
            )}
            {course.enrolled && !course.isFree && (
              <Badge className="border-0 bg-green-100 text-xs text-green-700 dark:bg-green-950 dark:text-green-400">
                {t("paywall.enrolled")}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            {course.title}
          </h1>

          {course.description && (
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {course.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <IconBook className="h-4 w-4" />
              {t("paywall.moduleCount", { count: course.sections.length })}
            </span>
            <span className="flex items-center gap-1.5">
              <IconVideo className="h-4 w-4" />
              {t("paywall.lessonCount", { count: course.lessonCount })}
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="order-1 md:order-2 relative aspect-video md:aspect-[4/3] overflow-hidden rounded-2xl border border-border/50 bg-muted">
          <Image
            src={course.thumbnail}
            alt={`Thumbnail for ${course.title}`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-transparent" />
        </div>
      </div>

      {/* ── Paywall (locked) OR progress (unlocked) ── */}
      {course.locked ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-sl-purple/5 to-sl-pink/5">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <IconLock className="h-4 w-4 text-sl-purple" />
                <h2 className="font-semibold tracking-tight text-foreground">
                  {t("paywall.lockedTitle")}
                </h2>
              </div>
              <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
                {t("paywall.lockedDescription")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
              {course.price && (
                <div className="text-right">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {course.price.formatted}
                  </span>
                </div>
              )}
              <EnrollButton
                courseSlug={courseHref}
                locale={locale as "en" | "it" | "sl" | "ru"}
                label={t("paywall.enroll")}
              />
              <span className="text-xs text-muted-foreground">
                {t("paywall.lifetimeAccess")}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t("paywall.yourProgress")}</span>
            <span className="tabular-nums">
              {t("paywall.progressSummary", {
                done: finishedCount,
                total: course.sections.length,
                percent: progress,
              })}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* ── Modules ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t("paywall.modules")}
        </h2>

        {course.sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("paywall.noModules")}</p>
        ) : (
          <div className="space-y-3">
            {course.sections.map((section, index) => {
              const sectionHref = `/${locale}/courses/${courseHref}/${section.slug ?? slugify(section.title)}`

              const inner = (
                <div className="flex items-start gap-4">
                  {/* Index / status badge */}
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      section.locked
                        ? "bg-muted text-muted-foreground"
                        : section.isFinished
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-gradient-to-br from-purple-500/15 to-pink-500/15 text-purple-600 dark:text-purple-300"
                    )}
                  >
                    {section.locked ? (
                      <IconLock className="h-4 w-4" />
                    ) : section.isFinished ? (
                      <IconCircleCheckFilled className="h-5 w-5" />
                    ) : (
                      <span className="tabular-nums">{index + 1}</span>
                    )}
                  </div>

                  {/* Title + description */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground leading-snug">
                        {section.title}
                      </h3>
                      {section.isFinished && !section.locked && (
                        <Badge className="border-0 bg-green-100 text-[10px] text-green-700 dark:bg-green-950 dark:text-green-400">
                          {t("paywall.completed")}
                        </Badge>
                      )}
                      {course.locked && section.isPreview && (
                        <Badge className="border-0 bg-sl-purple/10 text-[10px] text-sl-purple">
                          <IconSparkles className="mr-0.5 h-3 w-3" />
                          {t("paywall.freePreview")}
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {section.description ?? t("paywall.modulePlaceholder")}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconVideo className="h-3.5 w-3.5" />
                        {t("paywall.lessonCount", { count: section.itemCount })}
                      </span>
                    </div>
                  </div>

                  {/* Affordance */}
                  <div className="flex items-center gap-1 self-center text-muted-foreground transition-colors group-hover:text-foreground">
                    {section.locked ? (
                      <IconLock className="h-4 w-4" />
                    ) : (
                      <>
                        <IconPlayerPlay className="h-4 w-4" />
                        <IconChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </div>
                </div>
              )

              return section.locked ? (
                <div
                  key={section.id}
                  className="block cursor-not-allowed rounded-xl border border-border/50 bg-card/40 p-4 opacity-70"
                  aria-disabled
                  title={t("paywall.lockedModuleHint")}
                >
                  {inner}
                </div>
              ) : (
                <Link
                  key={section.id}
                  href={sectionHref}
                  className="group block rounded-xl border border-border/50 bg-card p-4 transition-all duration-150 hover:border-border hover:shadow-sm"
                >
                  {inner}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseContent
