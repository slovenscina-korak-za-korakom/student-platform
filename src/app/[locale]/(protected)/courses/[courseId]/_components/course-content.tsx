"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  IconBook,
  IconChevronLeft,
  IconChevronRight,
  IconLayoutSidebarLeftCollapse,
  IconPlayerPlay,
  IconPlayerPlayFilled,
  IconVideo,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {InferSelectModel} from "drizzle-orm";
import {coursesTable, sectionsTable, videosTable} from "@/db/schema";
import {useRouter} from "@/i18n/routing";

type CourseWithContent = InferSelectModel<typeof coursesTable> & {
  sections: (InferSelectModel<typeof sectionsTable> & {
    videos: InferSelectModel<typeof videosTable> []
  })[],
  videoCount: number
}
type CourseVideo = InferSelectModel<typeof videosTable>

type Props = {
  course: CourseWithContent;
}

// Flat list of all videos in order, for prev/next navigation
function flattenVideos(course: CourseWithContent): { video: CourseVideo; sectionTitle: string }[] {
  return course.sections.flatMap((section) =>
    section.videos.map((video) => ({ video, sectionTitle: section.title }))
  )
}

const CourseContent = ({ course }: Props) => {
  const router = useRouter()
  const allVideos = flattenVideos(course)
  const [currentVideoId, setCurrentVideoId] = useState(allVideos[0]?.video.id ?? null)

  const currentIndex = allVideos.findIndex((v) => v.video.id === currentVideoId)
  const currentEntry = allVideos[currentIndex]
  const completedCount = currentIndex // treat "watched up to here" as progress placeholder

  const defaultOpenSections = course.sections.map((s) => String(s.id))

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Course meta */}
      <div className="p-4 space-y-3 border-b border-border/60 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => router.push("/courses")}>
          <IconChevronLeft /> Courses
        </Button>
        <h2 className="font-semibold text-sm text-foreground leading-snug">{course.title}</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconBook className="h-3.5 w-3.5" />
            {course.sections.length} sections
          </span>
          <span className="flex items-center gap-1">
            <IconVideo className="h-3.5 w-3.5" />
            {course.videoCount} videos
          </span>
        </div>
        {/* Progress placeholder */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{completedCount}/{course.videoCount}</span>
          </div>
          <Progress value={(completedCount / course.videoCount) * 100} className="h-1.5" />
        </div>
      </div>

      {/* Section + video list */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={defaultOpenSections} className="w-full">
          {course.sections.map((section) => (
            <AccordionItem key={section.id} value={section.id.toString()} className="border-b border-border/40">
              <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline hover:bg-muted/40 text-left">
                <span className="leading-snug">{section.title}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                {section.videos.map((video) => {
                  const isActive = video.id === currentVideoId
                  return (
                    <button
                      key={video.id}
                      onClick={() => setCurrentVideoId(video.id)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors",
                        isActive && "bg-muted/60"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                          isActive
                            ? "bg-purple-600 text-white"
                            : "border border-border text-muted-foreground"
                        )}
                      >
                        {isActive ? (
                          <IconPlayerPlayFilled className="h-2.5 w-2.5" />
                        ) : video.order === 0 ? (
                          <IconPlayerPlay className="h-2.5 w-2.5" />
                        ) : (
                          <span className="text-[9px] font-bold leading-none" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs leading-snug line-clamp-2",
                            isActive ? "font-semibold text-foreground" : "text-muted-foreground",
                            video.order === 0 && !isActive && "italic"
                          )}
                        >
                          {video.title}
                          {video.order === 0 && (
                            <span className="not-italic text-purple-500 ml-1">(intro)</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 tabular-nums">
                          {video.duration}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col border-r border-border/60 bg-card/50">
        <SidebarContent />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile top bar with sidebar trigger */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 lg:hidden shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <IconLayoutSidebarLeftCollapse className="h-4 w-4" />
                Course contents
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          {currentEntry && (
            <p className="text-sm text-muted-foreground truncate">
              {currentEntry.sectionTitle}
            </p>
          )}
        </div>

        {/* Video player area */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {/* Player placeholder */}
          <div className="aspect-video bg-muted rounded-xl overflow-hidden relative flex items-center justify-center border border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="w-16 h-16 rounded-full bg-white/90 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-md">
                <IconPlayerPlayFilled className="h-7 w-7 text-purple-600 ml-0.5" />
              </div>
              <p className="text-sm text-muted-foreground">
                {/* TODO: Replace with actual video embed */}
                Video player goes here
              </p>
            </div>
          </div>

          {/* Video info */}
          {currentEntry && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {currentEntry.sectionTitle}
                  </Badge>
                  {currentEntry.video.order === 0 && (
                    <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-0">
                      Section Intro
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {currentEntry.video.title}
                </h1>
                {currentEntry.video.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentEntry.video.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentVideoId(allVideos[currentIndex - 1].video.id)}
                  className="gap-1.5"
                >
                  <IconChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentIndex + 1} / {course.videoCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === allVideos.length - 1}
                  onClick={() => setCurrentVideoId(allVideos[currentIndex + 1].video.id)}
                  className="gap-1.5"
                >
                  Next
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default CourseContent
