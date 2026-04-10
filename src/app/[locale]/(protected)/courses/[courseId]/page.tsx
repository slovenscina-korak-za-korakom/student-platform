import { notFound } from "next/navigation"
import CourseContent from "./_components/course-content"
import {getCourseInfo} from "@/actions/course-actions";

type Props = {
  params: Promise<{ locale: string; courseId: number }>
}

const CourseDetailPage = async ({ params }: Props) => {
  const { courseId } = await params
  const {course} = await getCourseInfo(courseId)
  const available = process.env.COURSES_AVAILABLE === "true"

  if (!course || !available) notFound()

  return <CourseContent course={course} />
}

export default CourseDetailPage
