"use client";
import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import GradientButton from "../ui/GradientButton";

interface TransferSectionProps {
  address: string;
}

export default function TransferSection({ address }: TransferSectionProps) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleSend = () => {
    if (!sendAmount || !recipient) return alert("请填写完整信息");

    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      return alert("请输入有效的以太坊地址");
    }

    const amountInWei = BigInt(Number(sendAmount) * 1e6);

    writeContract({
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
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
      args: [recipient as `0x${string}`, amountInWei],
    });
  };

  return (
    <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
      <h3 className="text-lg font-semibold mb-3">💸 转账 USDC</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="接收地址 0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white placeholder-gray-400"
        />
        <input
          type="number"
          placeholder="转账金额"
          value={sendAmount}
          onChange={(e) => setSendAmount(e.target.value)}
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white placeholder-gray-400"
        />
        <GradientButton
          onClick={handleSend}
          fromColor="from-green-500"
          toColor="to-emerald-600"
          disabled={!sendAmount || !recipient || isConfirming}
        >
          {isConfirming ? "确认中..." : "发送 USDC"}
        </GradientButton>
        {isConfirming && (
          <p className="text-blue-400 text-sm">🔄 交易处理中...</p>
        )}
        {isConfirmed && <p className="text-green-400 text-sm">✅ 转账成功！</p>}
      </div>
    </div>
  );
}
