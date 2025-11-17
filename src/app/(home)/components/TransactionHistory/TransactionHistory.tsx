// components/TransactionHistory/index.tsx
import { TransactionHistoryProps } from "./types";
import { useTransactions } from "./useTransaction";
import TransactionList from "./TransactionList"; // 可以进一步拆分列表UI

export default function TransactionHistory({
  address,
}: TransactionHistoryProps) {
  const {
    transactions,
    isLoading,
    isLoadingMore,
    hasMore,
    refetch,
    loadMore,
    currentPage,
    goToPage,
    totalPages,
  } = useTransactions(address, 5);

  return (
    <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">📜 交易历史</h3>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          {isLoading ? "刷新中..." : "刷新"}
        </button>
      </div>

      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        currentPage={currentPage}
        goToPage={goToPage}
        totalPages={totalPages}
      />
    </div>
  );
}
