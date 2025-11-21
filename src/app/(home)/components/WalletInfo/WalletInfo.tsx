"use client";

import { useSwitchChain, useBalance, useAccount } from "wagmi";
import { USDCTransferSection, EthTransferSection } from "../TransferSection";
import GradientButton from "../../../../components/ui/GradientButton";
import { getUsdcAddress } from "@/constants/tokens";
import TransactionHistory from "../TransactionHistory/TransactionHistory";
import ApprovalManager from "../ApprovalManager";

interface WalletInfoProps {
  onDisconnect: () => void;
}

export default function WalletInfo({ onDisconnect }: WalletInfoProps) {
  const { address, chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain(); // 新增这行

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address,
    query: {
      staleTime: 100000, // 立即视为过期
      gcTime: 6000000, // 立即垃圾回收
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      enabled: !!address, // 嵌套在 query 中
    },
  });

  const usdcAddress = getUsdcAddress(chain?.id);

  const { data: usdcBalanceData, isLoading: usdcLoading } = useBalance({
    address,
    token: usdcAddress,
    query: {
      staleTime: 100000, // 立即视为过期
      gcTime: 600000, // 立即垃圾回收
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      enabled: !!address, // 嵌套在 query 中
    },
  });

  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const handleSwitchChain = async (chainId: number) => {
    try {
      await switchChain({ chainId });
      console.log(`正在切换到链 ${chainId}`);
    } catch (err) {
      console.error("切换网络失败:", err);
      alert(`切换失败: ${err instanceof Error ? err.message : "未知错误"}`);
    }
  };

  // 检查是否正在切换网络或加载
  const isSwitchingNetwork = isConnected && !chain;
  // combine loading flags if needed later
  const isAnyLoading = balanceLoading || usdcLoading;

  return (
    <div className="text-center">
      {/* 网络切换器放在这里 */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <p className="text-sm text-gray-300 mb-2">切换网络</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleSwitchChain(11155111)}
            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30"
          >
            🧪 Sepolia
          </button>
          <button
            onClick={() => handleSwitchChain(1)}
            className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-sm hover:bg-purple-500/30"
          >
            🟣 Ethereum
          </button>
        </div>
      </div>
      {/* 网络切换状态提示 */}
      {isSwitchingNetwork && (
        <div className="mb-4 p-3 bg-yellow-500/20 text-yellow-400 rounded-lg">
          🔄 正在切换网络...
        </div>
      )}
      {/* 网络切换提醒 */}
      {/* <div>
        <p>身份地址: {address} （全网通用）</p>
        <p>当前网络: {chain?.name} （决定余额显示）</p>
        <p>网络ID: {chain?.id}</p>

        {chain?.id === 1 && (
          <div className="bg-green-100 text-green-800 p-2 rounded">
            当前在主网，操作真实资产！
          </div>
        )}
        {chain?.id === 11155111 && (
          <div className="bg-blue-100 text-blue-800 p-2 rounded">
            当前在Sepolia测试网，放心测试！
          </div>
        )}
      </div> */}
      <div className="mb-6">
        <div className="inline-flex items-center bg-green-500/20 text-green-400 py-1 px-3 rounded-full text-sm mb-4">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          已成功连接 - {chain?.name || "未知网络"}
          {isAnyLoading && (
            <span className="ml-2 text-xs text-gray-300">加载中...</span>
          )}
        </div>
        <p className="text-gray-300 mb-1">您的钱包地址</p>
        <p className="font-mono text-lg bg-black/20 p-3 rounded-lg break-all">
          {formattedAddress}
        </p>

        <div className="mt-4 space-y-2">
          <p className="font-semibold">
            {chain?.nativeCurrency?.symbol || "ETH"} 余额:{" "}
            {balanceData
              ? `${balanceData.formatted} ${balanceData.symbol}`
              : "加载中..."}
          </p>
          {chain?.id === 11155111 && ( // Sepolia chain ID
            <p>
              USDC 余额:{" "}
              {usdcBalanceData
                ? `${usdcBalanceData.formatted} ${usdcBalanceData.symbol}`
                : "加载中..."}
            </p>
          )}
        </div>
      </div>
      <EthTransferSection address={address} />
      <USDCTransferSection address={address} chain={chain} />
      <TransactionHistory address={address} />
      <ApprovalManager />
      <GradientButton
        onClick={onDisconnect}
        fromColor="from-gray-600"
        toColor="to-red-600"
        className="mt-4 py-2"
      >
        断开连接
      </GradientButton>
    </div>
  );
}
