import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconPlayerPlayFilled, IconVideo } from "@tabler/icons-react"
import { InferSelectModel } from "drizzle-orm"
import { coursesTable, sectionsTable, videosTable } from "@/db/schema"
import { slugify } from "@/lib/utils"
import { currentUser } from "@clerk/nextjs/server"
import { Separator } from "@/components/ui/separator"
import ModuleTest from "./module-test"
import PdfNotes from "./pdf-notes"
import {
  moduleQuiz,
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
        {/* ── Module test ── */}
        <ModuleTest questions={moduleQuiz} />

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
