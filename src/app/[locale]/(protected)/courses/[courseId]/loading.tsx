import Skeleton from "react-loading-skeleton"

const ModuleRowSkeleton = () => (
  <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4">
    <Skeleton circle width={36} height={36} containerClassName="shrink-0 mt-0.5" />
    <div className="flex-1 space-y-2">
      <Skeleton height={16} width="40%" />
      <Skeleton count={2} height={12} />
      <div className="flex items-center gap-4 pt-1">
        <Skeleton width={70} height={12} />
        <Skeleton width={60} height={12} />
      </div>
    </div>
  </div>
)

const CourseDetailLoading = () => {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-8 lg:p-10 space-y-8">
      {/* Back link */}
      <Skeleton width={90} height={28} borderRadius={6} />

      {/* Hero */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px] md:gap-8">
        <div className="order-2 space-y-4 md:order-1">
          <Skeleton width={70} height={22} borderRadius={9999} />
          <Skeleton height={32} width="70%" />
          <Skeleton count={2} height={14} />
          <div className="flex items-center gap-4">
            <Skeleton width={90} height={14} />
            <Skeleton width={80} height={14} />
          </div>
        </div>
        <Skeleton
          containerClassName="order-1 md:order-2 aspect-video md:aspect-[4/3] w-full block"
          height="100%"
          borderRadius={16}
        />
      </div>

      {/* Progress */}
      <Skeleton height={76} borderRadius={12} />

      {/* Modules */}
      <div className="space-y-4">
        <Skeleton width={100} height={22} />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ModuleRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CourseDetailLoading
