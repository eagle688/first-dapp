"use client";
import { useState, useEffect } from "react";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query"; // 正确的导入
import { parseEther } from "viem";
import GradientButton from "../../../../components/ui/GradientButton";

interface EthTransferSectionProps {
  address: `0x${string}` | undefined;
}

export default function EthTransferSection({
  address,
}: EthTransferSectionProps) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const queryClient = useQueryClient();

  // 修复 useBalance 的 enabled 配置
  const { data: balanceData } = useBalance({
    address,
    query: {
      enabled: !!address, // 嵌套在 query 中
    },
  });
  const userBalanceWei = balanceData?.value || 0n;

  const { sendTransaction, data: hash, isError, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      query: {
        enabled: !!hash, // 该钩子支持顶层 enabled，无需修改
      },
    });

  // 金额输入处理（不变）
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const regex = /^(\d+)(\.(\d{0,18}))?$/;
    if (regex.test(value) || value === "") {
      setSendAmount(value);
    }
  };

  const handleSend = () => {
    // 基础校验：非空
    if (!sendAmount || !recipient) return alert("请填写完整信息");

    // 地址校验（保留原逻辑）
    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      return alert("请输入有效的以太坊地址");
    }

    // 金额合法性校验
    if (parseFloat(sendAmount) <= 0) {
      return alert("请输入大于 0 的金额");
    }

    // 4. 安全转换金额：用 parseEther 避免精度问题
    let amountInWei: bigint;
    try {
      amountInWei = parseEther(sendAmount); // 直接将 ETH 字符串转为 wei（BigInt）
    } catch (err) {
      return alert("金额格式错误，请输入合法数字");
    }

    // 5. 余额不足校验
    if (amountInWei > userBalanceWei) {
      return alert(`余额不足！当前余额：${balanceData?.formatted || 0} ETH`);
    }

    // 发起交易
    sendTransaction({
      to: recipient as `0x${string}`,
      value: amountInWei,
    });
  };

  // 监听 ETH 交易确认
  useEffect(() => {
    if (isConfirmed) {
      console.log("ETH转账成功，刷新余额");
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      // 2. 立即重新获取（确保立即更新）
      queryClient.refetchQueries({ queryKey: ["balance"] });
      setSendAmount("");
      setRecipient("");
    }
  }, [isConfirmed, queryClient]);

  return (
    <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
      <h3 className="text-lg font-semibold mb-3">⚡ 转账 ETH</h3>
      {/* 显示当前余额（优化体验） */}
      {address && (
        <p className="text-sm text-gray-400 mb-2">
          当前余额：{balanceData?.formatted || "加载中..."} ETH
        </p>
      )}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="接收地址 0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white placeholder-gray-400"
          disabled={isConfirming} // 交易中禁止修改
        />
        <input
          type="text" // 改为 text 类型，配合 regex 精确控制输入
          placeholder="转账金额 (ETH，最多 18 位小数)"
          value={sendAmount}
          onChange={handleAmountChange}
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white placeholder-gray-400"
          disabled={isConfirming} // 交易中禁止修改
        />
        <GradientButton
          onClick={handleSend}
          fromColor="from-purple-500"
          toColor="to-indigo-600"
          disabled={!sendAmount || !recipient || isConfirming || !address}
        >
          {isConfirming ? "确认中..." : "发送 ETH"}
        </GradientButton>
        {/* 交易状态提示 */}
        {isConfirming && (
          <p className="text-blue-400 text-sm">🔄 交易处理中... 请在钱包确认</p>
        )}
        {isConfirmed && (
          <p className="text-green-400 text-sm">✅ ETH 转账成功！</p>
        )}
        {/* 交易失败提示 */}
        {isError && (
          <p className="text-red-400 text-sm">
            ❌ 交易失败：{error instanceof Error ? error.message : "未知错误"}
          </p>
        )}
      </div>
    </div>
  );
}
