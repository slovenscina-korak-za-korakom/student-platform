"use client"
import Link from "next/link"
import {Button} from "@/components/ui/button"
import {IconBook, IconChevronRight, IconVideo} from "@tabler/icons-react"
import {type InferSelectModel} from "drizzle-orm";
import {coursesTable} from "@/db/schema";
import Image from "next/image";

type Props = {
  course: InferSelectModel<typeof coursesTable> & {sections: number, videos: number};
  locale: string
}

const CourseCard = ({course, locale}: Props) => {

  return (
    <div
      className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border/80 hover:shadow-sm transition-all duration-150 flex flex-col">

      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Image src={course.thumbnail} alt={`Thumnail image for ${course.title}`} width={1920} height={1080}/>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Title + description */}
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold text-foreground leading-snug">{course.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconBook className="h-3.5 w-3.5"/>
            {course.sections} sections
          </span>
          <span className="flex items-center gap-1">
            <IconVideo className="h-3.5 w-3.5"/>
            {course.videos} videos
          </span>
          {/* Level badge */}
          <span className="flex items-center gap-1">
            {course.level}
          </span>
        </div>

        {/* CTA */}
        <Link href={`/${locale}/courses/${course.id}`}>
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
          >
            Start Course
            <IconChevronRight className="h-4 w-4 ml-1"/>
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default CourseCard
