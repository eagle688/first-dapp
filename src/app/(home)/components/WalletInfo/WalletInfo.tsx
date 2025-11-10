"use client";
import { useDisconnect, useBalance, useAccount } from "wagmi";
import TransferSection from "../TransferSection/TransferSection";
import GradientButton from "../../../../components/ui/GradientButton";

interface WalletInfoProps {
  onDisconnect: () => void;
}

export default function WalletInfo({ onDisconnect }: WalletInfoProps) {
  const { address, chain } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { data: usdcBalanceData } = useBalance({
    address,
    token: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  });

  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-flex items-center bg-green-500/20 text-green-400 py-1 px-3 rounded-full text-sm mb-4">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          已成功连接 - {chain?.name || "未知网络"}
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
          {chain?.id !== 11155111 && ( // Sepolia chain ID
            <p>
              USDC 余额:{" "}
              {usdcBalanceData
                ? `${usdcBalanceData.formatted} ${usdcBalanceData.symbol}`
                : "加载中..."}
            </p>
          )}
        </div>
      </div>

      <TransferSection address={address!} />

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
