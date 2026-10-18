import { notFound } from "next/navigation"
import ModuleContent from "./_components/module-content"
// import { getSectionInfo } from "@/actions/course-actions"
import { getMockSection } from "@/app/[locale]/(protected)/courses/[courseId]/_components/mock"

type Props = {
  params: Promise<{ locale: string; courseId: string; sectionId: string }>
}

const ModulePage = async ({ params }: Props) => {
  const { locale, sectionId } = await params
  // const { section } = await getSectionInfo(courseId, sectionId)
  const section = getMockSection(sectionId)
  const available = process.env.COURSES_AVAILABLE === "true"

  if (!section || !available) notFound()

  return <ModuleContent section={section} locale={locale} />
}

export default ModulePage
