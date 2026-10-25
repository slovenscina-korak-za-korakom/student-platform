import { notFound } from "next/navigation"
import { getTestBySlug } from "@/actions/course-actions"
import ExerciseEngine from "./_components/exercise-engine"

type Props = {
  params: Promise<{
    locale: string
    courseId: string
    sectionId: string
    testId: string
  }>
}

const TestPage = async ({ params }: Props) => {
  const { locale, courseId, sectionId, testId } = await params
  const available = process.env.COURSES_AVAILABLE === "true"
  if (!available) notFound()

  const test = await getTestBySlug(sectionId, testId)
  if (!test) notFound()

  const exitHref = `/${locale}/courses/${courseId}/${sectionId}`

  return <ExerciseEngine test={test} exitHref={exitHref} />
}

export default TestPage
