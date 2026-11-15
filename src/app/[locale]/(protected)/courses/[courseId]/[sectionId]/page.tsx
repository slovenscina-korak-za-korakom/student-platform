import { notFound, redirect } from "next/navigation"
import ModuleContent from "./_components/module-content"
import { getModuleContent } from "@/actions/course-actions"
import { coursesAvailableForCurrentUser } from "@/lib/course-access"

type Props = {
  params: Promise<{ locale: string; courseId: string; sectionId: string }>
}

const ModulePage = async ({ params }: Props) => {
  const { locale, courseId, sectionId } = await params
  const available = await coursesAvailableForCurrentUser()
  if (!available) notFound()

  const mod = await getModuleContent(courseId, sectionId)
  if (!mod) notFound()
  if ("locked" in mod) redirect(`/${locale}/courses/${courseId}`)

  return <ModuleContent module={mod} locale={locale} />
}

export default ModulePage
