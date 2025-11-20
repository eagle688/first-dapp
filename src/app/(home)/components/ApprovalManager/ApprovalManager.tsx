// components/ApprovalManager.tsx
"use client";
import { useState } from "react";
import { useTokenApprovals, type Approval } from "./useTokenApprovals";
import { useAccount } from "wagmi";
import { ApprovalTester } from "./ApprovalTester";

export default function ApprovalManager() {
  const { address } = useAccount();
  const { approvals, revokeApproval, isLoading } = useTokenApprovals(address);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = async (approval: Approval) => {
    const key = `${approval.tokenAddress}-${approval.spender}`;
    setRevoking(key);

    try {
      await revokeApproval(approval.tokenAddress, approval.spender);
      // 可以添加Toast提示
      alert("授权已撤销");
    } catch (error) {
      console.error("撤销失败:", error);
      alert("撤销失败，请重试");
    } finally {
      setRevoking(null);
    }
  };

  const formatAmount = (amount: bigint, symbol: string) => {
    // 简化显示逻辑，实际应该根据代币小数位数处理
    // 将wei单位转换为正常单位（USDC有6位小数）
    return `${(Number(amount) / 1e6).toLocaleString()} ${symbol}`;
  };

  const getSpenderName = (address: `0x${string}`) => {
    const SPENDER_NAMES: Record<string, string> = {
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45": "Uniswap V3",
      "0xE592427A0AEce92De3Edee1F18E0157C05861564": "Uniswap V3 Router",
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D": "Uniswap V2",
    };
    return (
      SPENDER_NAMES[address] || `${address.slice(0, 6)}...${address.slice(-4)}`
    );
  };

  if (!address) {
    return (
      <div className="mt-6 p-4 bg-gray-500/20 rounded-lg">
        <p className="text-gray-400 text-center">请先连接钱包查看授权</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🛡️ 授权管理</h3>
        <span className="text-sm text-gray-400">
          {approvals.length} 个活跃授权
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-center justify-between p-3 bg-black/20 rounded-lg"
            >
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-700 rounded w-24"></div>
              </div>
              <div className="h-8 bg-gray-700 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>暂无活跃授权</p>
          <p className="text-sm mt-2">使用DeFi协议时会自动创建授权</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval, index) => {
            const key = `${approval.tokenAddress}-${approval.spender}`;
            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{approval.symbol} 授权</p>
                  <p className="text-sm text-gray-400">
                    授权给 {getSpenderName(approval.spender)}
                  </p>
                  <p className="text-xs text-yellow-400 mt-1">
                    授权金额: {formatAmount(approval.amount, approval.symbol)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("确定要撤销此授权吗？")) {
                      handleRevoke(approval);
                    }
                  }}
                  disabled={revoking === key}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  {revoking === key ? "撤销中..." : "撤销授权"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-400 text-sm">
          💡 安全提示：定期检查并撤销不必要的授权，保护资产安全
        </p>
      </div>

      {/* 开发测试工具 */}
      {process.env.NODE_ENV === "development" && approvals.length === 0 && (
        <ApprovalTester />
      )}
    </div>
  );
}
