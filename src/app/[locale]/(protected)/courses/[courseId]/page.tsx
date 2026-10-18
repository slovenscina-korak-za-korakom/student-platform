import { notFound } from "next/navigation"
import CourseContent from "./_components/course-content"
// import {getCourseInfo} from "@/actions/course-actions";
import {getMockCourse} from "@/app/[locale]/(protected)/courses/[courseId]/_components/mock";

type Props = {
  params: Promise<{ locale: string; courseId: string }>
}

const CourseDetailPage = async ({ params }: Props) => {
  const { locale, courseId } = await params
  // const {course} = await getCourseInfo(courseId)
  const course = getMockCourse(courseId)
  const available = process.env.COURSES_AVAILABLE === "true"

  if (!course || !available) notFound()

  return <CourseContent course={course} locale={locale} />
}

export default CourseDetailPage
