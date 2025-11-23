// components/TransactionStatus.tsx 创建通用的错误提示组件
import { parseWalletError } from "@/utils/errorHandler";

interface TransactionStatusProps {
  error?: unknown;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  hash?: `0x${string}`;
  currentBlock?: number;
  confirmations?: number;
}

export default function TransactionStatus({
  error,
  isConfirming,
  isConfirmed,
  hash,
  currentBlock = 1,
  confirmations = 1,
}: TransactionStatusProps) {
  // 如果有错误，显示错误信息
  if (error) {
    const errorInfo = parseWalletError(error);

    return (
      <div
        className={`p-3 rounded-lg border ${
          errorInfo.severity === "error"
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : errorInfo.severity === "warning"
            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
        }`}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg">
            {errorInfo.severity === "error"
              ? "❌"
              : errorInfo.severity === "warning"
              ? "⚠️"
              : "ℹ️"}
          </span>
          <div>
            <div className="font-medium">{errorInfo.title}</div>
            <div className="text-sm mt-1">{errorInfo.message}</div>
          </div>
        </div>
      </div>
    );
  }

  // 交易确认中
  if (isConfirming) {
    return (
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <div>
            <div className="font-medium">交易处理中</div>
            <div className="text-sm mt-1">
              {hash
                ? `已提交: ${hash.slice(0, 10)}...${hash.slice(-8)}`
                : "请在钱包中确认..."}
            </div>
            {hash && (
              <div className="text-xs mt-1">
                确认进度: {currentBlock}/{confirmations}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 交易成功
  if (isConfirmed) {
    return (
      <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <div>
            <div className="font-medium">交易成功</div>
            <div className="text-sm mt-1">
              交易已确认{" "}
              {confirmations > 1 ? `(${confirmations} 个区块确认)` : ""}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
