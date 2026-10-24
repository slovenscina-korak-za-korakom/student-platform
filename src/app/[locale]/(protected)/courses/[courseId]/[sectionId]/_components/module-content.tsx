import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlayerPlayFilled,
  IconSparkles,
  IconVideo,
} from "@tabler/icons-react"
import { InferSelectModel } from "drizzle-orm"
import { coursesTable, sectionsTable, videosTable } from "@/db/schema"
import { slugify } from "@/lib/utils"
import { currentUser } from "@clerk/nextjs/server"
import { Separator } from "@/components/ui/separator"
import PdfNotes from "./pdf-notes"
import { getTestsForSection } from "@/lib/course-exercises"
import {
  mockNotesTitle,
  mockAnswersTitle,
} from "@/app/[locale]/(protected)/courses/[courseId]/_components/mock"

type SectionWithContent = InferSelectModel<typeof sectionsTable> & {
  course: InferSelectModel<typeof coursesTable>
  videos: InferSelectModel<typeof videosTable>[]
}

type Props = {
  section: SectionWithContent
  locale: string
}

const ModuleContent = async ({ section, locale }: Props) => {
  // Primary video = first in order. The rest of the module layout is a TODO.
  const primaryVideo = section.videos[0]

  // Watermark the notes with the viewer's identity (traceable on leak).
  const user = await currentUser()
  const watermark =
    user?.primaryEmailAddress?.emailAddress ?? user?.id ?? "licensed user"

  const slug = slugify(section.title)
  const courseSlug = slugify(section.course.title)

  // Interactive tests for this module (Duolingo-style, on a dedicated page).
  const tests = getTestsForSection(slug)
  const t = await getTranslations("courses.test")

  return (
    <div className="flex flex-col">
      {/* ── Back to course overview (top) ── */}
      <div className="px-5 pt-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={`/${locale}/courses/${slugify(section.course.title)}`}>
            <IconChevronLeft className="h-4 w-4" />
            {section.course.title}
          </Link>
        </Button>
      </div>

      {/* ── Primary video: full-width, top priority ── */}
      <div className="p-5 pt-3">
        <div className="relative flex w-full aspect-video max-h-[80vh] items-center justify-center overflow-hidden rounded-xl bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 shadow-lg backdrop-blur-sm">
              <IconPlayerPlayFilled className="ml-0.5 h-7 w-7 text-white" />
            </div>
            <p className="text-sm text-white/60">
              {/* TODO: Replace with actual video embed */}
              {primaryVideo ? "Video player goes here" : "No videos in this module yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-5 pb-8 md:px-8 md:pb-10 space-y-6">
        {/* ── Interactive practice: links to the dedicated test page(s) ── */}
        {tests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconSparkles className="h-5 w-5 text-sl-accent" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {t("launcher.title")}
              </h2>
            </div>
            <div className="space-y-3">
              {tests.map((test) => (
                <Link
                  key={test.id}
                  href={`/${locale}/courses/${courseSlug}/${slug}/test/${test.id}`}
                  className="group flex items-center gap-4 rounded-2xl border-2 border-sl-accent/20 bg-gradient-to-r from-sl-blue/5 via-sl-purple/5 to-sl-pink/5 p-4 shadow-[0_3px_0_0] shadow-sl-accent/20 transition-colors hover:border-sl-accent/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sl-blue to-sl-pink text-white">
                    <IconSparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground">{t(test.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("launcher.count", { count: test.exercises.length })}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-sl-accent px-4 py-2 text-sm font-semibold text-white transition-transform group-hover:translate-x-0.5">
                    {t("launcher.start")}
                    <IconChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* ── Lecture notes (PDF) ── */}
        <PdfNotes
          fileUrl={`/api/courses/notes/${slug}?kind=notes`}
          title={mockNotesTitle}
          watermark={watermark}
        />

        <Separator />

        {/* ── Test review: walkthrough of the test answers ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconVideo className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Test review
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            A walkthrough of the test questions and answers.
          </p>
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 shadow-lg backdrop-blur-sm">
                <IconPlayerPlayFilled className="ml-0.5 h-6 w-6 text-white" />
              </div>
              <p className="text-sm text-white/60">
                {/* TODO: Replace with the answers-walkthrough video embed */}
                Answers walkthrough video goes here
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Written answers (PDF) ── */}
        <PdfNotes
          fileUrl={`/api/courses/notes/${slug}?kind=answers`}
          title={mockAnswersTitle}
          watermark={watermark}
        />
      </div>
    </div>
  )
}

export default ModuleContent
