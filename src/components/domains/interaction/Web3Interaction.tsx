// components/Web3Interaction.tsx
"use client";

import { useConnection, useBalance, useWriteContract } from "wagmi";
import { useState } from "react";

// 简单的代币合约ABI（用于演示）
const SIMPLE_TOKEN_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface Web3InteractionProps {
  postId: string;
  author: string;
  content: string;
}

export default function Web3Interaction({
  postId,
  author,
}: Web3InteractionProps) {
  const { address, isConnected } = useConnection();
  const { data: balance } = useBalance({ address });
  const [donationAmount, setDonationAmount] = useState("0.001");
  const [isMinting, setIsMinting] = useState(false);

  // 模拟打赏功能
  const { write: sendDonation } = useWriteContract({
    address: "0x...", // 这里可以放一个测试网代币地址
    abi: SIMPLE_TOKEN_ABI,
    functionName: "transfer",
    onSuccess: () => {
      alert("打赏成功！感谢支持作者！");
    },
    onError: (error) => {
      console.error("打赏失败:", error);
      alert("打赏失败，请重试");
    },
  });

  const handleDonate = () => {
    if (!isConnected) {
      alert("请先连接钱包");
      return;
    }
    // 这里实际应该调用合约
    alert(`模拟打赏 ${donationAmount} ETH 给作者 ${author}`);
  };

  const handleMintNFT = async () => {
    if (!isConnected) {
      alert("请先连接钱包");
      return;
    }

    setIsMinting(true);
    try {
      // 模拟NFT铸造过程
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("🎉 文章已成功铸造成NFT！");
    } catch (error) {
      console.error("铸造失败:", error);
      alert("铸造失败，请重试");
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 mb-4">连接钱包后解锁更多功能</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleDonate}
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
          >
            💝 打赏作者
          </button>
          <button
            onClick={handleMintNFT}
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
          >
            🎨 铸造NFT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* 打赏功能 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">💝 支持作者</h3>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">打赏金额 (ETH)</label>
            <input
              type="text"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.001"
            />
          </div>
          <button
            onClick={handleDonate}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded hover:from-green-600 hover:to-blue-600 transition-all"
          >
            打赏 {donationAmount} ETH
          </button>
        </div>

        {/* NFT铸造功能 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">🎨 收藏文章</h3>
          <p className="text-sm text-gray-600">
            将这篇文章铸造成NFT，永久保存在区块链上
          </p>
          <button
            onClick={handleMintNFT}
            disabled={isMinting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all"
          >
            {isMinting ? "铸造中..." : "铸造文章NFT"}
          </button>
        </div>
      </div>

      {/* 钱包信息 */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-sm text-gray-600">
          当前钱包: {address?.slice(0, 8)}...{address?.slice(-6)}
        </p>
        <p className="text-sm text-gray-600">
          余额: {balance?.formatted} {balance?.symbol}
        </p>
      </div>
    </div>
  );
}
