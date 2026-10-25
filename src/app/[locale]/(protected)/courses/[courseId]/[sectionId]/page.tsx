import { notFound } from "next/navigation"
import ModuleContent from "./_components/module-content"
import { getModuleContent } from "@/actions/course-actions"

type Props = {
  params: Promise<{ locale: string; courseId: string; sectionId: string }>
}

const ModulePage = async ({ params }: Props) => {
  const { locale, courseId, sectionId } = await params
  const available = process.env.COURSES_AVAILABLE === "true"
  if (!available) notFound()

  const mod = await getModuleContent(courseId, sectionId, locale)
  if (!mod) notFound()

  return <ModuleContent module={mod} locale={locale} />
}

export default ModulePage
