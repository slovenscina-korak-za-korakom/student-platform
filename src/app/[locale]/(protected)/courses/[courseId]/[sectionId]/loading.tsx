import Skeleton from "react-loading-skeleton"

const ModuleLoading = () => {
  return (
    <div className="flex flex-col">
      {/* Back link */}
      <div className="px-5 pt-5">
        <Skeleton width={120} height={28} borderRadius={6} />
      </div>

      {/* Video */}
      <div className="p-5 pt-3">
        <Skeleton
          containerClassName="w-full aspect-video max-h-[80vh] block"
          height="100%"
          borderRadius={12}
        />
      </div>

      {/* Details */}
      <div className="mx-auto w-full max-w-4xl px-5 pb-8 md:px-8 md:pb-10 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton width={80} height={22} borderRadius={9999} />
          <Skeleton height={32} width="60%" />
          <Skeleton count={2} height={14} />
        </div>

        {/* Video info */}
        <div className="space-y-2">
          <Skeleton height={22} width="45%" />
          <Skeleton count={2} height={14} />
        </div>
      </div>
    </div>
  )
}

export default ModuleLoading
