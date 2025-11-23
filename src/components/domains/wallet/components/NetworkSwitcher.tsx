// components/NetworkSwitcher.tsx
"use client";
import { useSwitchChain, useChainId } from "wagmi";
import { SUPPORTED_CHAINS, CHAIN_NAMES, CHAIN_ICONS } from "@/lib/chains";
import { useState } from "react";

export default function NetworkSwitcher() {
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const currentChainId = useChainId();
  const [showNetworkList, setShowNetworkList] = useState(false);

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await switchChain({ chainId });
      setShowNetworkList(false);
    } catch (error) {
      console.error("切换网络失败:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      alert(`网络切换失败: ${errorMessage}`);
    }
  };

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CHAIN_ICONS[currentChainId] || "🔗"}</span>
          <div className="text-left">
            <div className="text-sm font-medium">
              {CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`}
            </div>
            <div className="text-xs text-gray-400">当前网络</div>
          </div>
        </div>
        <button
          onClick={() => setShowNetworkList(!showNetworkList)}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
        >
          切换 {showNetworkList ? "▲" : "▼"}
        </button>
      </div>

      {showNetworkList && (
        <div className="mt-3 p-2 bg-black/20 rounded space-y-1">
          {SUPPORTED_CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleSwitchNetwork(chain.id)}
              disabled={chain.id === currentChainId || isSwitchingChain}
              className={`w-full px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                chain.id === currentChainId
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-white/5 hover:bg-white/10 text-white"
              } disabled:opacity-50`}
            >
              <span>{CHAIN_ICONS[chain.id] || "🔗"}</span>
              <span className="flex-1 text-left">{CHAIN_NAMES[chain.id]}</span>
              {chain.id === currentChainId && (
                <span className="text-xs">当前</span>
              )}
              {isSwitchingChain && chain.id !== currentChainId && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
