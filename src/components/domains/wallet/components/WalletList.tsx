// components/WalletList.tsx
"use client";
import { useState } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { metaMask, injected, walletConnect } from "wagmi/connectors";
import { DetectedWallet } from "../types/wallet";
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

  const otherWallets = detectedWallets.filter(
    (wallet) => wallet.type !== "metamask"
  );

  const handleConnectMetaMask = async () => {
    setConnecting(true);
    try {
      if (currentAddress) await disconnect();
      await connect({ connector: metaMask() });
      onConnectSuccess();
    } catch (err) {
      console.error("MetaMask 连接错误:", err);
      // 错误处理逻辑...
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
    } finally {
      setConnecting(false);
    }
  };

  // 其他钱包连接逻辑可以放在这里或单独的 hook 中

  return (
    <div className="space-y-3">
      <GradientButton
        onClick={handleConnectMetaMask}
        disabled={connecting}
        fromColor="from-blue-500"
        toColor="to-purple-600"
        className="w-full"
      >
        <span className="mr-2">🦊</span>
        连接 MetaMask
        {connecting && " (连接中...)"}
      </GradientButton>

      <GradientButton
        onClick={handleConnectWalletConnect}
        disabled={connecting}
        fromColor="from-green-500"
        toColor="to-blue-600"
        className="w-full"
      >
        <span className="mr-2">📱</span>
        WalletConnect
        {connecting && " (连接中...)"}
      </GradientButton>

      {/* 其他钱包列表... */}
    </div>
  );
}
