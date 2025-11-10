"use client";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import WalletConnect from "../components/common/WalletConnect";
import WalletInfo from "../components/home/WalletInfo";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [manualConnected, setManualConnected] = useState(false);

  const isReallyConnected = isConnected || manualConnected;

  const handleConnectSuccess = () => {
    setManualConnected(true);
  };

  const handleDisconnect = () => {
    disconnect();
    setManualConnected(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex flex-col items-center justify-center p-8 text-white">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-center mb-2">我的首个DApp</h1>
        <p className="text-center text-gray-300 mb-8">欢迎进入Web3世界</p>

        {!isReallyConnected ? (
          <WalletConnect onConnectSuccess={handleConnectSuccess} />
        ) : (
          <WalletInfo onDisconnect={handleDisconnect} />
        )}
      </div>

      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>基于 Next.js + Wagmi 构建</p>
      </div>
    </div>
  );
}
