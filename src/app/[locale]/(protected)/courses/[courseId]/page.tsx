import { notFound } from "next/navigation"
import CourseContent from "./_components/course-content"
import { getCourseBySlug } from "@/actions/course-actions"

type Props = {
  params: Promise<{ locale: string; courseId: string }>
}

const CourseDetailPage = async ({ params }: Props) => {
  const { locale, courseId } = await params
  const available = process.env.COURSES_AVAILABLE === "true"
  if (!available) notFound()

  const course = await getCourseBySlug(courseId, locale)
  if (!course) notFound()

  return <CourseContent course={course} locale={locale} />
}

export default CourseDetailPage
