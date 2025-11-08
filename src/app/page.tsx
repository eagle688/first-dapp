// 您的页面组件 (page.tsx)
"use client";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";

export default function HomePage() {
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const connectMetaMask = () => {
    connect({ connector: metaMask() });
  };

  // 格式化地址，使其更易读
  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex flex-col items-center justify-center p-8 text-white">
      {/* 主卡片 */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-center mb-2">我的首个DApp</h1>
        <p className="text-center text-gray-300 mb-8">欢迎进入Web3世界</p>

        {!isConnected ? (
          // 未连接状态
          <div className="text-center">
            <button
              onClick={connectMetaMask}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              连接 MetaMask 钱包
            </button>
            <p className="text-sm text-gray-400 mt-4">请确保已安装MetaMask</p>
          </div>
        ) : (
          // 已连接状态
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center bg-green-500/20 text-green-400 py-1 px-3 rounded-full text-sm mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                已成功连接
              </div>
              <p className="text-gray-300 mb-1">您的钱包地址</p>
              <p className="font-mono text-lg bg-black/20 p-3 rounded-lg break-all">
                {formattedAddress}
              </p>
            </div>

            <button
              onClick={() => disconnect()}
              className="bg-gradient-to-r from-gray-600 to-red-600 hover:from-gray-700 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              断开连接
            </button>
          </div>
        )}
      </div>

      {/* 页脚信息 */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>基于 Next.js + Wagmi 构建</p>
      </div>
    </div>
  );
}
