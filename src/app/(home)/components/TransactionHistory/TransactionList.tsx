// TransactionList.tsx
import { TransactionListProps } from "./types";
import { EmptyState } from "./EmptyState";
import { Transaction } from "./types";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { formatAddress } from "@/utils/format";

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

      {/* 分页 / 加载更多 - 仅在移动端显示 */}
      {hasMore && (
        <div className="flex justify-center pt-4 md:hidden">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            {isLoadingMore ? "加载中..." : "加载更多"}
          </button>
        </div>
      )}

      {/* 分页按钮（桌面端显示页码） */}
      <div className="mt-4 flex items-center justify-center space-x-2">
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
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 子组件：单个交易项
function TransactionItem({ transaction }: { transaction: Transaction }) {
  return (
    <a
      href={transaction.explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-black/20 rounded-lg hover:bg-black/30 transition-colors cursor-pointer group gap-3"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <TransactionIcon
          type={transaction.type}
          category={transaction.category}
        />

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate group-hover:text-blue-200 transition-colors md:text-md">
            {transaction.type === "receive" ? "接收" : "发送"}{" "}
            {transaction.value} {transaction.tokenSymbol}
          </p>
          <p className="text-sm text-gray-200 truncate md:text-sm">
            {transaction.type === "receive" ? "来自" : "至"}:{" "}
            {formatAddress(
              transaction.type === "receive" ? transaction.from : transaction.to
            )}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0 ml-0 md:ml-4 flex flex-col items-end">
        <p
          className={`text-sm font-mono ${
            transaction.type === "receive" ? "text-green-400" : "text-red-400"
          } md:text-base`}
        >
          {transaction.type === "receive" ? "+" : "-"}
          {transaction.value} {transaction.tokenSymbol}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(transaction.timestamp).toLocaleDateString("zh-CN")}
        </p>

        {/* On larger screens, show short tx hash and category */}
        <div className="hidden md:flex items-center space-x-2 mt-2 text-xs text-gray-400">
          <span className="font-mono">{transaction.hash.slice(0, 10)}...</span>
          <span className="px-2 py-0.5 bg-white/5 rounded">
            {transaction.category}
          </span>
        </div>
      </div>
    </a>
  );
}

function TransactionIcon({
  type,
  category,
}: {
  type: string;
  category: string;
}) {
  const getIcon = () => {
    if (category === "erc20") return "🪙";
    if (type === "receive") return "⬇️";
    return "⬆️";
  };

  const getColor = () => {
    if (type === "receive") return "bg-green-500/20 text-green-400";
    return "bg-red-500/20 text-red-400";
  };

  return <div className={`p-2 rounded-full ${getColor()}`}>{getIcon()}</div>;
}
