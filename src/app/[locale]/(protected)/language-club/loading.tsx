import Skeleton from "react-loading-skeleton"

const DAYS = 7
const WEEKS = 5

const LangCardSkeleton = () => (
  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
    {/* Gradient accent bar */}
    <div className="h-px w-full bg-gradient-to-r from-blue-500 to-violet-500" />

    <div className="p-4 space-y-3">
      {/* Header: theme + date/time */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <Skeleton height={18} width="70%" />
          <Skeleton height={14} width="40%" />
        </div>
        <div className="text-right space-y-1 shrink-0">
          <Skeleton width={60} height={14} />
          <Skeleton width={48} height={12} />
        </div>
      </div>

      {/* Description */}
      <Skeleton count={2} height={13} />

      {/* Badges */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width={64} height={22} borderRadius={9999} />
        ))}
      </div>

      {/* Price + CTA */}
      <div className="flex items-center justify-between pt-1">
        <Skeleton width={60} height={32} />
        <Skeleton width={100} height={32} borderRadius={6} />
      </div>
    </div>
  </div>
)

const LanguageClubLoading = () => {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Page header */}
      <div className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-14 rounded-full bg-gradient-to-b from-blue-500 to-violet-500 shrink-0" />
          <div className="space-y-2">
            <Skeleton width={200} height={28} />
            <Skeleton width={280} height={16} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-10 pb-6 flex flex-col lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 lg:h-full lg:min-h-0">

          {/* Calendar */}
          <div className="w-full lg:flex-1 lg:min-h-0">
            <div className="rounded-2xl border border-border/40 bg-sidebar/50 h-full p-4 flex flex-col gap-4">
              {/* Calendar header: today btn + title + prev/next */}
              <div className="flex items-center justify-between shrink-0">
                <Skeleton width={56} height={28} borderRadius={6} />
                <Skeleton width={120} height={18} />
                <div className="flex gap-1">
                  <Skeleton width={28} height={28} borderRadius={6} />
                  <Skeleton width={28} height={28} borderRadius={6} />
                </div>
              </div>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7">
                {Array.from({ length: DAYS }).map((_, i) => (
                  <div key={i} className="flex justify-center py-1">
                    <Skeleton width={24} height={12} />
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-rows-5 gap-px flex-1">
                {Array.from({ length: WEEKS }).map((_, week) => (
                  <div key={week} className="grid grid-cols-7 gap-px">
                    {Array.from({ length: DAYS }).map((_, day) => (
                      <div key={day} className="flex flex-col p-1 border border-border/30 rounded min-h-[52px]">
                        <div className="flex justify-end">
                          <Skeleton circle width={24} height={24} />
                        </div>
                        {(week * DAYS + day) % 5 === 0 && (
                          <Skeleton height={8} borderRadius={9999} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Events panel */}
          <div className="w-full lg:w-80 flex flex-col">
            {/* Date label row */}
            <div className="flex items-center gap-2 mb-2 h-5">
              <Skeleton width={180} height={12} />
            </div>

            {/* Event cards */}
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <LangCardSkeleton key={i} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default LanguageClubLoading
