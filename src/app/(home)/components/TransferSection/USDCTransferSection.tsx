"use client";
import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query"; // 正确的导入

import { parseUnits } from "viem"; // 适配 ERC-20 任意小数位数的转换工具
import GradientButton from "../../../../components/ui/GradientButton";
import { USDC } from "@/constants/tokens";

interface TransferSectionProps {
  address: `0x${string}` | undefined;
  chain: { id: number } | undefined;
}

export default function USDCTransferSection({
  address,
  chain,
}: TransferSectionProps) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const queryClient = useQueryClient();

  // 1. 获取当前网络的 USDC 合约地址
  const usdcAddress = chain?.id ? USDC[chain.id] : undefined;

  // 2. 查询用户的 USDC 余额（ERC-20 余额查询，decimal: 6）
  const { data: usdcBalanceData } = useBalance({
    address,
    token: usdcAddress, // 指定 USDC 合约地址，查询 ERC-20 余额
    query: {
      enabled: !!address && !!usdcAddress, // 地址和 USDC 合约都存在时才查询
      staleTime: 0, // 5 秒内不重复查询
    },
  });
  const userUSDCBalance = usdcBalanceData?.value || 0n; // 余额（wei/cent 单位）

  // 3. 交易相关钩子：补充错误状态
  const { writeContract, data: hash, isError, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      query: {
        enabled: !!hash,
      },
    });

  // 4. 金额输入处理：限制 6 位小数，禁止无效格式
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 正则：允许整数、带小数点的数字，或者以小数点开头（例如 .5），小数部分最多 6 位（USDC 特性）
    const regex = /^(?:\d+|\d*\.\d{0,6})$/;
    if (regex.test(value) || value === "") {
      setSendAmount(value);
    }
  };

  const handleSend = () => {
    // 基础校验
    if (!sendAmount || !recipient || !address || !usdcAddress || !chain) {
      return alert("请填写完整信息并确保网络/钱包已连接");
    }

    // 地址格式校验：更严格地校验十六进制地址格式（不做 checksum 验证）
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(recipient)) {
      return alert("请输入有效的以太坊地址");
    }

    // 金额合法性校验
    const amountNum = parseFloat(sendAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return alert("请输入大于 0 的有效金额");
    }

    // 5. 安全转换金额：parseUnits 适配 6 位小数，无精度丢失
    let amountInCent: bigint;
    try {
      // parseUnits(金额字符串, 小数位数)：直接处理字符串，避免浮点数误差
      amountInCent = parseUnits(sendAmount, 6); // USDC 是 6 位小数，固定传 6
    } catch (err) {
      console.error("parseUnits error:", err);
      return alert("金额格式错误，请输入合法数字");
    }

    // 6. 余额不足校验（转换后的金额 ≤ 用户余额）
    if (amountInCent > userUSDCBalance) {
      const balanceFormatted = usdcBalanceData?.formatted || "0";
      return alert(`USDC 余额不足！当前余额：${balanceFormatted} USDC`);
    }

    // 7. 发起 USDC 转账交易
    writeContract({
      address: usdcAddress,
      abi: [
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
      ],
      functionName: "transfer",
      args: [recipient as `0x${string}`, amountInCent],
    });
  };

  // 监听 USDC 交易确认
  useEffect(() => {
    if (isConfirmed) {
      console.log("USDC转账成功，刷新余额");
      // 只刷新与当前用户+代币相关的余额缓存，避免全局抖动
      queryClient.invalidateQueries({
        queryKey: ["tokenBalance", address, usdcAddress],
      });

      setSendAmount("");
      setRecipient("");
    }
  }, [isConfirmed, queryClient, address, usdcAddress]);

  return (
    <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
      <h3 className="text-lg font-semibold mb-3">💸 转账 USDC</h3>

      {/* 显示当前网络 + USDC 余额 */}
      <div className="mb-2 text-sm">
        {usdcAddress ? (
          <p className="text-gray-400">
            当前网络：{chain?.id} | USDC 余额：
            {usdcBalanceData?.formatted || "加载中..."}
          </p>
        ) : (
          <p className="text-yellow-400">⚠️ 当前网络不支持 USDC</p>
        )}
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="接收地址 0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white placeholder-gray-400"
          disabled={isConfirming || !usdcAddress} // 无 USDC 合约或交易中禁止修改
        />
        <input
          type="text" // 改为 text 类型，配合正则控制格式
          inputMode="decimal" // 移动端弹出数字键盘
          placeholder="转账金额 (USDC，最多 6 位小数)"
          value={sendAmount}
          onChange={handleAmountChange}
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white placeholder-gray-400"
          disabled={isConfirming || !usdcAddress}
        />
        <GradientButton
          onClick={handleSend}
          fromColor="from-green-500"
          toColor="to-emerald-600"
          // 禁用条件：缺少参数、交易中、无 USDC 合约
          disabled={
            !sendAmount ||
            !recipient ||
            !address ||
            !usdcAddress ||
            isConfirming
          }
        >
          {isConfirming ? "确认中..." : "发送 USDC"}
        </GradientButton>

        {/* 交易状态提示（全覆盖） */}
        {isConfirming && (
          <p className="text-blue-400 text-sm">🔄 交易处理中... 请在钱包确认</p>
        )}
        {isConfirmed && (
          <p className="text-green-400 text-sm">✅ USDC 转账成功！</p>
        )}
        {isError && (
          <p className="text-red-400 text-sm">
            ❌ 交易失败：{error instanceof Error ? error.message : "未知错误"}
          </p>
        )}
      </div>
    </div>
  );
}
