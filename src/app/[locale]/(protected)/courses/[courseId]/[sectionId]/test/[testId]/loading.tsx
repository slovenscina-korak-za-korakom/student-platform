import Skeleton from "react-loading-skeleton"

const TestLoading = () => {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-6 md:py-10">
      {/* Exit + progress bar */}
      <div className="mb-8 flex items-center gap-4">
        <Skeleton width={24} height={24} circle />
        <Skeleton containerClassName="flex-1 block" height={16} borderRadius={9999} />
      </div>

      {/* Prompt */}
      <div className="space-y-4">
        <Skeleton width="40%" height={14} />
        <Skeleton width="55%" height={44} />
      </div>

      {/* Options */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Skeleton height={96} borderRadius={16} />
        <Skeleton height={96} borderRadius={16} />
        <Skeleton height={96} borderRadius={16} />
      </div>
    </div>
  )
}

export default TestLoading
