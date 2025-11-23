// components/WalletConnect.tsx - 简化后的主组件
"use client";
import { useAccount, useChainId } from "wagmi";
import { WalletConnectProps } from "./types/wallet";
import { useWalletDetection } from "./hooks/useWalletDetection";
import NetworkSwitcher from "./components/NetworkSwitcher";
import WalletList from "./components/WalletList";

export default function WalletConnect({
  onConnectSuccess,
}: WalletConnectProps) {
  const { address: currentAddress } = useAccount();
  const currentChainId = useChainId();
  const { detectedWallets } = useWalletDetection();

  return (
    <div className="text-center space-y-4">
      {/* 网络切换 */}
      {currentAddress && <NetworkSwitcher />}

      {/* 钱包连接 */}
      <p className="text-gray-300 mb-4">选择连接方式</p>
      <WalletList
        detectedWallets={detectedWallets}
        onConnectSuccess={onConnectSuccess}
      />

      {/* 状态信息 */}
      <div className="text-xs text-gray-400 bg-black/20 p-3 rounded-lg">
        💡 检测到 {detectedWallets.length} 个钱包 + WalletConnect
        <br />
        • 支持 5 个网络
        <br />• 当前网络: {currentChainId}
        {currentAddress && (
          <>
            <br />• 当前地址: {currentAddress.slice(0, 6)}...
            {currentAddress.slice(-4)}
          </>
        )}
      </div>
    </div>
  );
}
