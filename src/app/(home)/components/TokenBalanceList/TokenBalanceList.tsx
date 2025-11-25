// components/TokenBalanceList.tsx - 使用缓存版本
"use client";
import { useState } from "react";
import { useCachedMultiTokenBalances } from "./useCachedMultiTokenBalances";
import GradientButton from "@/components/ui/GradientButton";

export default function TokenBalanceList() {
  const {
    tokens,
    loading,
    addCustomToken,
    refreshBalances,
    customTokensCount,
  } = useCachedMultiTokenBalances();

  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [addingToken, setAddingToken] = useState(false);

  const handleAddCustomToken = async () => {
    if (!customTokenAddress.trim()) return;

    setAddingToken(true);
    try {
      await addCustomToken(customTokenAddress.trim());
      setCustomTokenAddress("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add token");
    } finally {
      setAddingToken(false);
    }
  };

  if (loading && tokens.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          加载代币余额...
        </div>
        <div className="text-sm text-gray-400 mt-2">使用缓存优化</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 缓存状态提示 */}
      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="text-sm text-green-400">
          ✅ 已启用缓存优化 (30秒缓存)
          {customTokensCount > 0 && ` • ${customTokensCount} 个自定义代币`}
        </div>
      </div>

      {/* 代币列表 */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">💰 Token Balances</h3>
        {tokens.map((token) => (
          <div
            key={token.address}
            className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{token.symbol}</span>
                <span className="text-sm text-gray-400">{token.name}</span>
                {token.isCustom && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    Custom
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 truncate font-mono">
                {token.address}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm">
                {token.balanceFormatted || "0"}
              </div>
              <div className="text-xs text-gray-400">{token.symbol}</div>
              {token.balanceFormatted && (
                <div className="text-xs text-green-400">已缓存</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 添加自定义代币 */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-medium mb-2">Add Custom Token</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Token contract address 0x..."
            value={customTokenAddress}
            onChange={(e) => setCustomTokenAddress(e.target.value)}
            className="flex-1 p-2 rounded bg-black/20 border border-white/20 text-white placeholder-gray-400"
          />
          <GradientButton
            onClick={handleAddCustomToken}
            disabled={!customTokenAddress.trim() || addingToken}
            fromColor="from-blue-500"
            toColor="to-cyan-600"
          >
            {addingToken ? "Adding..." : "Add"}
          </GradientButton>
        </div>
      </div>

      {/* 刷新按钮 */}
      <div className="flex justify-center">
        <GradientButton
          onClick={refreshBalances}
          disabled={loading}
          fromColor="from-gray-500"
          toColor="to-gray-600"
        >
          {loading ? "Refreshing..." : "Refresh Balances"}
        </GradientButton>
      </div>
    </div>
  );
}
