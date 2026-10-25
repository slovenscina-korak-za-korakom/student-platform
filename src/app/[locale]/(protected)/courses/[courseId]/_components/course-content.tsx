import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  IconBook,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconPlayerPlay,
  IconVideo,
} from "@tabler/icons-react"
import { cn, slugify } from "@/lib/utils"
import { InferSelectModel } from "drizzle-orm"
import { coursesTable, modulesTable } from "@/db/schema"

type CourseWithContent = InferSelectModel<typeof coursesTable> & {
  // Resolved from i18n keys by course-actions (DB no longer stores plain text).
  title: string
  description: string | null
  sections: (InferSelectModel<typeof modulesTable> & {
    title: string
    description: string | null
    isFinished: boolean
    itemCount: number
  })[]
  lessonCount: number
}

type Props = {
  course: CourseWithContent
  locale: string
}

const CourseContent = ({ course, locale }: Props) => {
  const finishedCount = course.sections.filter((s) => s.isFinished).length
  const progress = course.sections.length
    ? Math.round((finishedCount / course.sections.length) * 100)
    : 0

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-8 lg:p-10 space-y-8">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href={`/${locale}/courses`}>
          <IconChevronLeft className="h-4 w-4" />
          Courses
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
                Coming soon
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
              {course.sections.length} modules
            </span>
            <span className="flex items-center gap-1.5">
              <IconVideo className="h-4 w-4" />
              {course.lessonCount} lessons
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

      {/* ── Progress ── */}
      <div className="space-y-2 rounded-xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Your progress</span>
          <span className="tabular-nums">
            {finishedCount}/{course.sections.length} modules · {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* ── Modules ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Modules</h2>

        {course.sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No modules have been added to this course yet.
          </p>
        ) : (
          <div className="space-y-3">
            {course.sections.map((section, index) => {
              return (
                <Link
                  key={section.id}
                  href={`/${locale}/courses/${course.slug ?? slugify(course.title)}/${section.slug ?? slugify(section.title)}`}
                  className="group block rounded-xl border border-border/50 bg-card p-4 transition-all duration-150 hover:border-border hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {/* Index / status badge */}
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        section.isFinished
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-gradient-to-br from-purple-500/15 to-pink-500/15 text-purple-600 dark:text-purple-300"
                      )}
                    >
                      {section.isFinished ? (
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
                        {section.isFinished && (
                          <Badge className="border-0 bg-green-100 text-[10px] text-green-700 dark:bg-green-950 dark:text-green-400">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {section.description ??
                          "Placeholder description for this module — add a short summary of what learners will cover here."}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconVideo className="h-3.5 w-3.5" />
                          {section.itemCount} lessons
                        </span>
                      </div>
                    </div>

                    {/* Affordance */}
                    <div className="flex items-center gap-1 self-center text-muted-foreground transition-colors group-hover:text-foreground">
                      <IconPlayerPlay className="h-4 w-4" />
                      <IconChevronRight className="h-4 w-4" />
                    </div>
                  </div>
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
