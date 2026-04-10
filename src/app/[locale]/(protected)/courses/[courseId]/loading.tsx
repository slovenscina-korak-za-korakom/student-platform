import Skeleton from "react-loading-skeleton"

const VideoRowSkeleton = () => (
  <div className="flex items-start gap-3 px-4 py-2.5">
    <Skeleton circle width={20} height={20} containerClassName="shrink-0 mt-0.5" />
    <div className="flex-1 space-y-1">
      <Skeleton height={12} />
      <Skeleton width={40} height={10} />
    </div>
  </div>
)

const SectionSkeleton = () => (
  <div className="border-b border-border/40">
    {/* Section header */}
    <div className="px-4 py-3">
      <Skeleton height={16} width="60%" />
    </div>
    {/* Videos */}
    {Array.from({ length: 3 }).map((_, i) => (
      <VideoRowSkeleton key={i} />
    ))}
  </div>
)

const CourseDetailLoading = () => {
  return (
    <div className="flex h-[calc(100vh-var(--header-height))] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col border-r border-border/60">
        <div className="p-4 space-y-3 border-b border-border/60">
          {/* Back button */}
          <Skeleton width={80} height={28} borderRadius={6} />
          {/* Course title */}
          <Skeleton height={18} />
          <Skeleton width="50%" height={18} />
          {/* Meta row */}
          <div className="flex items-center gap-3">
            <Skeleton width={90} height={14} />
            <Skeleton width={80} height={14} />
          </div>
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton width={50} height={12} />
              <Skeleton width={30} height={12} />
            </div>
            <Skeleton height={6} borderRadius={9999} />
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <SectionSkeleton key={i} />
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 lg:hidden shrink-0">
          <Skeleton width={130} height={32} borderRadius={6} />
          <Skeleton width={140} height={16} />
        </div>

        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {/* Video player */}
          <Skeleton containerClassName="aspect-video w-full block" height="100%" borderRadius={12} />

          {/* Video info */}
          <div className="space-y-4">
            <div className="space-y-2">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <Skeleton width={90} height={22} borderRadius={9999} />
                <Skeleton width={110} height={22} borderRadius={9999} />
              </div>
              {/* Title */}
              <Skeleton height={28} width="65%" />
              {/* Description */}
              <Skeleton count={2} height={14} />
            </div>

            <Skeleton height={1} />

            {/* Prev / Next nav */}
            <div className="flex items-center justify-between">
              <Skeleton width={90} height={32} borderRadius={6} />
              <Skeleton width={50} height={14} />
              <Skeleton width={70} height={32} borderRadius={6} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CourseDetailLoading