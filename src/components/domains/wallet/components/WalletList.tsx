// components/WalletList.tsx
"use client";
import { useState } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { metaMask, injected, walletConnect } from "wagmi/connectors";
import { DetectedWallet } from "../types/wallet";
import { useOtherWalletConnection } from "../hooks/useOtherWalletConnection";
import GradientButton from "@/components/ui/GradientButton";

interface WalletListProps {
  detectedWallets: DetectedWallet[];
  onConnectSuccess: () => void;
}

export default function WalletList({
  detectedWallets,
  onConnectSuccess,
}: WalletListProps) {
  const { connect } = useConnect();
  const { address: currentAddress } = useAccount();
  const { disconnect } = useDisconnect();
  const [connecting, setConnecting] = useState(false);
  const [showWalletList, setShowWalletList] = useState(false);

  const { handleConnectOtherWallet, connecting: otherWalletConnecting } =
    useOtherWalletConnection(onConnectSuccess);

  const otherWallets = detectedWallets.filter(
    (wallet) => wallet.type !== "metamask"
  );
  const isConnecting = connecting || otherWalletConnecting;

  const handleConnectMetaMask = async () => {
    setConnecting(true);
    try {
      if (currentAddress) await disconnect();
      await connect({ connector: metaMask() });
      onConnectSuccess();
    } catch (err) {
      console.error("MetaMask 连接错误:", err);
      const msg =
        err instanceof Error
          ? err.message.includes("user rejected")
            ? "用户拒绝授权"
            : err.message.includes("No Ethereum provider found")
            ? "未检测到 MetaMask 钱包，请安装后重试"
            : err.message
          : "未知错误";
      alert(`MetaMask 连接失败: ${msg}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectWalletConnect = async () => {
    setConnecting(true);
    try {
      await connect({ connector: walletConnect() });
      onConnectSuccess();
    } catch (err) {
      console.error("WalletConnect 连接错误:", err);
      const msg = err instanceof Error ? err.message : "未知错误";
      alert(`WalletConnect 连接失败: ${msg}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* MetaMask 连接按钮 */}
      <GradientButton
        onClick={handleConnectMetaMask}
        disabled={isConnecting}
        fromColor="from-blue-500"
        toColor="to-purple-600"
        className="w-full"
      >
        <span className="mr-2">🦊</span>
        连接 MetaMask
        {isConnecting && " (连接中...)"}
      </GradientButton>

      {/* WalletConnect 按钮 */}
      <GradientButton
        onClick={handleConnectWalletConnect}
        disabled={isConnecting}
        fromColor="from-green-500"
        toColor="to-blue-600"
        className="w-full"
      >
        <span className="mr-2">📱</span>
        WalletConnect
        {isConnecting && " (连接中...)"}
      </GradientButton>

      {/* 其他钱包展开按钮 - 现在功能完整了 */}
      <div>
        <button
          onClick={() => setShowWalletList(!showWalletList)}
          disabled={otherWallets.length === 0 || isConnecting}
          className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
        >
          <span className="mr-2">🔶</span>
          连接其他钱包 {showWalletList ? "▼" : "▶"}
          {otherWallets.length > 0 && ` (${otherWallets.length})`}
        </button>

        {/* 其他钱包列表（展开时显示） */}
        {showWalletList && (
          <div className="mt-2 p-3 bg-white/5 rounded-lg space-y-2 border border-white/10">
            {otherWallets.length > 0 ? (
              otherWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnectOtherWallet(wallet)}
                  disabled={isConnecting}
                  className="w-full px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{wallet.emoji}</span>
                  {wallet.name}
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-400 py-2">未检测到其他钱包</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
