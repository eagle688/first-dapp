// components/TransactionHistory/LoadingSkeleton.tsx
export function LoadingSkeleton() {
  return (
    <div className="space-y-3" data-testid="loading-skeleton">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse flex items-center space-x-4 p-3 bg-black/20 rounded-lg"
        >
          <div className="rounded-full bg-gray-700 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-4 bg-gray-700 rounded w-16 ml-auto"></div>
            <div className="h-3 bg-gray-700 rounded w-12 ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
