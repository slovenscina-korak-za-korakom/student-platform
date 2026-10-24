import { notFound } from "next/navigation"
import { getTest } from "@/lib/course-exercises"
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
  const test = getTest(sectionId, testId)

  if (!test || !available) notFound()

  const exitHref = `/${locale}/courses/${courseId}/${sectionId}`

  return <ExerciseEngine test={test} exitHref={exitHref} />
}

export default TestPage
