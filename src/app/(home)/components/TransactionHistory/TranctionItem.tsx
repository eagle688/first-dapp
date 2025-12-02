import { Transaction } from "./types";
import { formatAddress } from "@/utils/formatAddress";
import TransactionIcon from "./TransactionIcon";

// 子组件：单个交易项
export default function TransactionItem({
  transaction,
}: {
  transaction: Transaction;
}) {
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
