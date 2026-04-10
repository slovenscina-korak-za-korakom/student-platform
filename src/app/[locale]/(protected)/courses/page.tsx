import Image from "next/image";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {getTranslations} from "next-intl/server";
import CourseCard from "./_components/course-card";
import {getCourses} from "@/actions/course-actions";


const CoursePage = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params
  const t = await getTranslations("courses")
  const t2 = await getTranslations("common.badges")
  const available = process.env.COURSES_AVAILABLE === "true"

  const {courses, status} = await getCourses()

  if (!available || status !== 200) {
    return (
      <div className="flex flex-col p-6 min-h-[calc(100vh-var(--header-height))]">
        {/* Main Content - Two Column Layout */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Side - Booking Card */}
            <div className="w-full">
              <div className="bg-white p-6 dark:bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
                {/* Image Section */}
                <div
                  className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                  {/* Background Image */}
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                    alt="Modern workspace with laptop and learning materials"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Gradient overlay for depth and color blend */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/40 via-blue-500/30 to-transparent"/>

                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-white text-gray-900 border-0 shadow-sm font-semibold tracking-tight px-3 py-1">
                      {t2("coming-soon")}
                    </Badge>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="h-20 w-full bg-transparent"/>
              </div>
            </div>

            {/* Right Side - Course Information */}
            <div className="w-full flex flex-col justify-center space-y-6 pt-10">
              <div className="space-y-4">
                <Badge variant={"outline"}
                       className={"bg-gradient-to-r from-sl-purple to-sl-pink text-white uppercase font-black tracking-wide"}>
                  {t2("coming-soon")}
                </Badge>
                <h2 className="text-3xl font-semibold tracking-tighter text-foreground">
                  {t("title")}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>
              <div>
                <Button
                  variant={"outline"}
                  disabled
                >
                  {t2("join-waitlist")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Courses</h1>
        <p className="text-sm text-muted-foreground">
          Pick a course and start learning Slovenian at your own pace.
        </p>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} locale={locale} />
        ))}
      </div>
    </div>
  )
};
export default CoursePage;
