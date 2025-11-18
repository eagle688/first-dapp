// components/ApprovalTester.tsx
"use client";
import { useWriteContract } from "wagmi";
import { erc20Abi } from "viem";

export function ApprovalTester() {
  const { writeContract, isPending } = useWriteContract();

  const createTestApproval = () => {
    writeContract({
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC
      abi: erc20Abi,
      functionName: "approve",
      args: [
        "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap V3
        BigInt(1000000000), // 1000 USDC (6位小数)
      ],
    });
  };

  return (
    <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
      <h4 className="font-medium text-purple-400 mb-2">🧪 授权功能测试</h4>
      <p className="text-sm text-gray-400 mb-3">
        点击按钮创建一个测试授权，用于验证授权管理功能
      </p>
      <button
        onClick={createTestApproval}
        disabled={isPending}
        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 rounded-lg text-sm transition-colors"
      >
        {isPending ? "创建中..." : "创建测试授权"}
      </button>
    </div>
  );
}
