export function TransactionPagination({
  isLoadingMore,
  hasMore,
  onLoadMore,
  currentPage,
  goToPage,
  totalPages,
}: {
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentPage?: number;
  goToPage?: (n: number) => void;
  totalPages?: number;
}) {
  if (!hasMore && (!totalPages || totalPages <= 1)) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-center space-x-2">
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          {isLoadingMore ? "加载中..." : "加载更多"}
        </button>
      )}

      {typeof totalPages === "number" && totalPages > 1 && (
        <div className="hidden md:flex items-center space-x-1">
          {Array.from({
            length: totalPages,
          }).map((_, idx) => {
            const pageNum = idx + 1;
            const active = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => goToPage?.(pageNum)}
                className={`px-3 py-1 rounded ${
                  active ? "bg-blue-600 text-white" : "bg-white/5 text-gray-200"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
