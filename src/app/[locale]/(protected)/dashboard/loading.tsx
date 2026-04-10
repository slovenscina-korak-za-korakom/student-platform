import Skeleton from "react-loading-skeleton"

const DAYS = 7
const WEEKS = 5

const DashboardLoading = () => {
  return (
    <main className="w-full h-full flex flex-col gap-8 p-0 md:p-10 lg:p-12">
      {/* Greeting */}
      <div className="px-4 pt-8 md:p-0 flex-shrink-0">
        <Skeleton width={480} height={48} />
        <Skeleton width={240} height={24} />
      </div>

      {/* Stat cards — hidden on mobile, matches `hidden md:grid` */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 bg-sidebar/50 dark:bg-sidebar/15 px-5 py-4 space-y-4"
          >
            <div className="flex items-start justify-between">
              <Skeleton width={100} height={14} />
              <Skeleton width={20} height={20} borderRadius={6} />
            </div>
            <Skeleton width={60} height={48} />
            <Skeleton width={140} height={14} />
          </div>
        ))}
      </div>

      {/* Main content: 2/3 calendar + 1/3 events panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 min-h-0">

        {/* Unified calendar (2 cols) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border/40 bg-sidebar/50 dark:bg-sidebar/15 p-4 h-full flex flex-col gap-4">
            {/* Month nav */}
            <div className="flex items-center justify-between">
              <Skeleton width={140} height={36} />
              <div className="flex gap-2">
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
                    <div key={day} className="flex flex-col p-1 min-h-[52px] border border-border/30 rounded">
                      <div className="flex justify-end">
                        <Skeleton circle width={24} height={24} />
                      </div>
                      {(week + day) % 4 === 0 && (
                        <Skeleton width="80%" height={6} borderRadius={9999} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Events panel (1 col) */}
        <div className="lg:col-span-1 p-4 flex flex-col gap-6">
          {/* Empty-state card */}
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border/40 bg-sidebar/50 dark:bg-sidebar/15 gap-4">
            <Skeleton circle width={64} height={64} />
            <Skeleton width={160} height={20} />
            <Skeleton count={2} width={200} height={14} />
            <Skeleton width={120} height={32} borderRadius={6} />
          </div>

          {/* "X upcoming events" row */}
          <div className="flex items-center gap-2">
            <Skeleton width={160} height={14} />
          </div>
        </div>
      </div>
    </main>
  )
}

export default DashboardLoading
