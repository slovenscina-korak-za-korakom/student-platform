import Skeleton from "react-loading-skeleton"

const CourseCardSkeleton = () => (
  <div className="rounded-xl border border-border/50 overflow-hidden flex flex-col p-0 m-0">
    {/* Thumbnail */}
    <Skeleton containerClassName="aspect-video w-full block leading-none bg-sidebar/50 dark:bg-sidebar/15" height="100%" borderRadius={0} />

    <div className="p-4 flex flex-col gap-3 flex-1">
      {/* Title + description */}
      <div className="space-y-1 flex-1">
        <Skeleton height={20} width="75%" />
        <Skeleton count={2} height={14} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <Skeleton width={80} height={14} />
        <Skeleton width={70} height={14} />
        <Skeleton width={50} height={14} />
      </div>

      {/* CTA button */}
      <Skeleton height={32} borderRadius={6} />
    </div>
  </div>
)

const CoursesLoading = () => {
  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <Skeleton width={100} height={28} />
        <Skeleton width={280} height={16} />
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export default CoursesLoading
