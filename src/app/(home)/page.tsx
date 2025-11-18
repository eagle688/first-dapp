"use client";
import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import WalletConnect from "../../components/domains/wallet/WalletConnect";
import WalletInfo from "./components/WalletInfo/WalletInfo";
import ApprovalManager from "./components/ApprovalManager";

export default function HomePage() {
  const { isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const [manualConnected, setManualConnected] = useState(false);
  const [forceDisconnected, setForceDisconnected] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 使用setTimeout将setState变为异步
    setTimeout(() => {
      setIsHydrated(true);
    }, 0);
  }, []);

  const isReallyConnected =
    isHydrated && ((isConnected && !forceDisconnected) || manualConnected);

  const handleConnectSuccess = () => {
    setManualConnected(true);
    setForceDisconnected(false);
  };

  const handleDisconnect = () => {
    // For injected wallets (MetaMask / OKX) calling connector.disconnect()
    // may mark the provider as permanently disconnected in the extension
    // and prevent it from prompting again. Avoid calling disconnect for
    // injected providers so the browser extension can still show the
    // permissions prompt on the next connect attempt.
    const injectedLike =
      connector?.id === "injected" ||
      (connector?.name && /meta|okx|injected/i.test(String(connector.name)));

    if (!injectedLike) {
      // For non-injected connectors (WalletConnect, etc.) perform a full disconnect
      disconnect();
    } else {
      // For injected providers, don't call wagmi.disconnect() (some extensions
      // treat that as a permanent programmatic disconnect). Instead, toggle a
      // local flag so UI hides while the provider remains available for future
      // connect attempts.
      setForceDisconnected(true);
    }

    setManualConnected(false);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-full md:max-w-3xl lg:max-w-6xl border border-white/20">
          <div className="text-center text-white">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex flex-col items-center justify-center p-8 text-white">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-10 w-full max-w-full md:max-w-3xl lg:max-w-6xl border border-white/20">
        <h1 className="text-3xl font-bold text-center mb-2">我的首个DApp1</h1>
        <p className="text-center text-gray-300 mb-8">欢迎进入Web3世界</p>
        <ApprovalManager />
        {!isReallyConnected ? (
          <WalletConnect onConnectSuccess={handleConnectSuccess} />
        ) : (
          <WalletInfo onDisconnect={handleDisconnect} />
        )}
      </div>
    </div>
  );
}
