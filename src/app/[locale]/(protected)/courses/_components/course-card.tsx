"use client"
import Link from "next/link"
import {useTranslations} from "next-intl"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {IconBook, IconChevronRight, IconLock, IconVideo} from "@tabler/icons-react"
import {type InferSelectModel} from "drizzle-orm";
import {coursesTable} from "@/db/schema";
import Image from "next/image";
import {slugify} from "@/lib/utils";

type Props = {
  course: InferSelectModel<typeof coursesTable> & {
    title: string
    description: string | null
    sections: number
    lessons: number
    isFree: boolean
    enrolled: boolean
    locked: boolean
    price: { currency: string; amount: number; formatted: string } | null
  };
  locale: string
}

const CourseCard = ({course, locale}: Props) => {
  const t = useTranslations("courses")

  return (
    <div
      className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border/80 hover:shadow-sm transition-all duration-150 flex flex-col">

      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Image src={course.thumbnail} alt={`Thumnail image for ${course.title}`} width={1920} height={1080}/>
        </div>
        {/* Access badge */}
        <div className="absolute top-2 left-2 z-10">
          {course.enrolled ? (
            <Badge className="border-0 bg-green-100 text-[10px] text-green-700 dark:bg-green-950 dark:text-green-400">
              {course.isFree ? t("paywall.free") : t("paywall.enrolled")}
            </Badge>
          ) : course.price ? (
            <Badge className="border-0 bg-white/90 text-[10px] font-semibold text-gray-900 shadow-sm">
              {course.price.formatted}
            </Badge>
          ) : null}
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
            {t("paywall.moduleCount", { count: course.sections })}
          </span>
          <span className="flex items-center gap-1">
            <IconVideo className="h-3.5 w-3.5"/>
            {t("paywall.lessonCount", { count: course.lessons })}
          </span>
          {/* Level badge */}
          <span className="flex items-center gap-1">
            {course.level}
          </span>
        </div>

        {/* CTA */}
        <Link href={`/${locale}/courses/${course.slug ?? slugify(course.title)}`}>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
          >
            {course.locked ? (
              <>
                <IconLock className="h-4 w-4 mr-1"/>
                {t("paywall.previewCourse")}
              </>
            ) : (
              <>
                {t("paywall.startCourse")}
                <IconChevronRight className="h-4 w-4 ml-1"/>
              </>
            )}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default CourseCard
