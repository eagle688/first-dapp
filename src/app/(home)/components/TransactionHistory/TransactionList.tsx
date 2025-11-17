// TransactionList.tsx
import { TransactionListProps } from "./types";
import { EmptyState } from "./EmptyState";
import { Transaction } from "./types";
import { LoadingSkeleton } from "./LoadingSkeleton";

export default function TransactionList({
  transactions,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: TransactionListProps & {
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  if (isLoading && transactions.length === 0) {
    return <LoadingSkeleton />;
  }

  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {/* 交易列表 */}
      {transactions.map((tx) => (
        <TransactionItem key={tx.hash} transaction={tx} />
      ))}

      {/* 加载更多 */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            {isLoadingMore ? "加载中..." : "加载更多"}
          </button>
        </div>
      )}
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
      className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors cursor-pointer group"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <TransactionIcon
          type={transaction.type}
          category={transaction.category}
        />

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate group-hover:text-blue-400 transition-colors">
            {transaction.type === "receive" ? "接收" : "发送"}{" "}
            {transaction.value} {transaction.tokenSymbol}
          </p>
          <p className="text-sm text-gray-400 truncate">
            {transaction.type === "receive" ? "来自" : "至"}:{" "}
            {formatAddress(
              transaction.type === "receive" ? transaction.from : transaction.to
            )}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0 ml-4">
        <p
          className={`text-sm font-mono ${
            transaction.type === "receive" ? "text-green-400" : "text-red-400"
          }`}
        >
          {transaction.type === "receive" ? "+" : "-"}
          {transaction.value} {transaction.tokenSymbol}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(transaction.timestamp).toLocaleDateString("zh-CN")}
        </p>
      </div>
    </a>
  );
}

// 工具函数
function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
