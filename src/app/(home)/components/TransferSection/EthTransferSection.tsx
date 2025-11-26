"use client";
import { useState, useEffect } from "react";
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  useBalance,
  useBlockNumber, // 新增：用于交易确认进度
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import GradientButton from "@/components/ui/GradientButton";
import GasConfigPanel from "../GasConfigPannel";
import TransactionStatus from "@/components/domains/transactionStatus"; // 使用新的状态组件

interface EthTransferSectionProps {
  address: `0x${string}` | undefined;
}

export default function EthTransferSection({
  address,
}: EthTransferSectionProps) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [gasConfig, setGasConfig] = useState({});
  const [transactionError, setTransactionError] = useState<unknown>(null); // 新增：错误状态
  const queryClient = useQueryClient();

  // 新增：监听区块高度，用于显示确认进度
  const { data: currentBlock } = useBlockNumber({ watch: true });

  const { data: balanceData } = useBalance({
    address,
    query: { enabled: !!address },
  });
  const userBalanceWei = balanceData?.value || 0n;

  const { sendTransaction, data: hash, isError, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
      query: { enabled: !!hash },
    });

  // 金额输入处理（不变）
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const regex = /^(?:\d+|\d*\.\d{0,18})$/;
    if (regex.test(value) || value === "") {
      setSendAmount(value);
    }
  };

  // 错误处理 Effect：捕获 sendTransaction 的错误
  useEffect(() => {
    if (isError && error) {
      setTransactionError(error);
    }
  }, [isError, error]);

  const handleSend = () => {
    // 重置错误状态
    setTransactionError(null);

    // 基础校验：非空
    if (!sendAmount || !recipient) {
      setTransactionError(new Error("请填写接收地址和转账金额"));
      return;
    }

    // 地址校验
    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      setTransactionError(
        new Error("请输入有效的以太坊地址（0x开头，42位长度）")
      );
      return;
    }

    // 金额合法性校验
    if (parseFloat(sendAmount) <= 0) {
      setTransactionError(new Error("请输入大于 0 的金额"));
      return;
    }

    // 安全转换金额
    let amountInWei: bigint;
    try {
      amountInWei = parseEther(sendAmount);
    } catch {
      setTransactionError(new Error("金额格式错误，请输入合法数字"));
      return;
    }

    // 余额不足校验
    if (amountInWei > userBalanceWei) {
      setTransactionError(
        new Error(`余额不足！当前余额：${balanceData?.formatted || 0} ETH`)
      );
      return;
    }

    // 发起交易
    sendTransaction({
      to: recipient as `0x${string}`,
      value: amountInWei,
      ...gasConfig, // 合并 Gas 配置
    });
  };

  // 监听 ETH 交易确认
  useEffect(() => {
    if (isConfirmed) {
      console.log("ETH转账成功，刷新余额");
      // 重置错误状态
      setTransactionError(null);
      // 仅刷新当前 address 的余额缓存
      queryClient.invalidateQueries({ queryKey: ["balance", address] });
      queryClient.refetchQueries({ queryKey: ["balance", address] });
      setSendAmount("");
      setRecipient("");
    }
  }, [isConfirmed, queryClient, address]);

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
          disabled={isConfirming}
        />
        <input
          type="text"
          placeholder="转账金额 (ETH，最多 18 位小数)"
          value={sendAmount}
          onChange={handleAmountChange}
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white placeholder-gray-400"
          disabled={isConfirming}
        />

        {/* 集成 Gas 配置面板 */}
        <GasConfigPanel
          onConfigChange={setGasConfig}
          defaultGasLimit={21000n}
        />

        {/* 替换原来的简单状态提示 -> 使用新的精细化 TransactionStatus 组件 */}
        <TransactionStatus
          error={transactionError}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          hash={hash}
          currentBlock={currentBlock ? Number(currentBlock) : 1}
          confirmations={1} // 可以根据需要调整确认数
        />

        <GradientButton
          onClick={handleSend}
          fromColor="from-purple-500"
          toColor="to-indigo-600"
          disabled={!sendAmount || !recipient || isConfirming || !address}
        >
          {isConfirming ? "确认中..." : "发送 ETH"}
        </GradientButton>
      </div>
    </div>
  );
}
