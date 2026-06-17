export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-2" />
          </div>
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}