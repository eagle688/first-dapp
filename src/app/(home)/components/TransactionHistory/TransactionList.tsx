// TransactionList.tsx
import { TransactionListProps } from "./types";
import { EmptyState } from "./EmptyState";
import { Transaction } from "./types";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { TransactionPagination } from "./TransactionPagination";
import TransactionItem from "./TranctionItem";

export default function TransactionList({
  transactions,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  currentPage,
  goToPage,
  totalPages,
  allTransactions,
}: TransactionListProps & {
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentPage?: number;
  goToPage?: (n: number) => void;
  totalPages?: number;
  allTransactions?: Transaction[];
}) {
  if (isLoading && transactions.length === 0) {
    return <LoadingSkeleton />;
  }

  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {/* 交易列表 - 每项在移动端垂直，在较大屏幕横向排列并留出更多空间 */}
      {/* Mobile: show full accumulated list */}
      <div className="md:hidden space-y-3">
        {allTransactions && allTransactions.length > 0 ? (
          allTransactions.map((tx, i) => (
            <TransactionItem key={`${tx.hash}-${i}`} transaction={tx} />
          ))
        ) : (
          <></>
        )}
      </div>

      {/* Desktop: show paginated list */}
      <div className="hidden md:block space-y-3">
        {transactions.map((tx, i) => (
          <TransactionItem key={`${tx.hash}-${i}`} transaction={tx} />
        ))}
      </div>
      <TransactionPagination
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        currentPage={currentPage}
        goToPage={goToPage}
        totalPages={totalPages}
      />
    </div>
  );
}
