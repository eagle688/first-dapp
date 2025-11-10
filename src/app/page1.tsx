"use client";
import { useState } from "react";
import {
  useConnect,
  useAccount,
  useDisconnect,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import { metaMask, injected } from "wagmi/connectors";

// 提取转账组件，保持主组件简洁
function TransferSection({ address }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleSend = () => {
    if (!sendAmount || !recipient) return alert("请填写完整信息");

    // 添加地址格式验证
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
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white"
        />
        <input
          type="number"
          placeholder="转账金额"
          value={sendAmount}
          onChange={(e) => setSendAmount(e.target.value)}
          className="w-full p-2 rounded bg-black/20 border border-white/20 text-white"
        />
        <button
          onClick={handleSend}
          disabled={!sendAmount || !recipient}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-2 px-4 rounded transition-all duration-200 disabled:cursor-not-allowed"
        >
          {isConfirming ? "确认中..." : "发送 USDC"}
        </button>
        {isConfirming && (
          <p className="text-blue-400 text-sm">🔄 交易处理中...</p>
        )}
        {isConfirmed && <p className="text-green-400 text-sm">✅ 转账成功！</p>}
      </div>
    </div>
  );
}

// 主组件保持简洁
export default function HomePage() {
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });
  const { data: usdcBalanceData } = useBalance({
    address,
    token: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  });

  const connectMetaMask = () => connect({ connector: metaMask() });

  // 在useAccount后添加一个手动状态
  const [manualConnected, setManualConnected] = useState(false);

  const connectOtherWallet = async () => {
    if (window.okxwallet) {
      try {
        console.log("1. 尝试断开现有连接...");

        // 方法一：尝试断开现有连接
        disconnect();

        console.log("2. 开始连接OKX钱包...");
        const accounts = await window.okxwallet.request<string[]>({
          method: "eth_requestAccounts",
        });

        if (accounts?.[0]) {
          console.log("✅ OKX连接成功，账户:", accounts);
          setManualConnected(true);
          // 手动触发wagmi连接状态更新
          // 这里需要创建一个injected连接器实例
          const injectedConnector = injected();
          connect({ connector: injectedConnector });
        }
      } catch (error) {
        console.log("❌ OKX连接失败:", error);
        alert(
          "连接失败: " + (error instanceof Error ? error.message : "未知错误")
        );
      }
    } else {
      alert("未检测到OKX钱包，请确认已安装并启用Web3模式");
    }
  };

  const formattedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // 修改连接判断逻辑
  const isReallyConnected = isConnected || manualConnected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex flex-col items-center justify-center p-8 text-white">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-center mb-2">我的首个DApp</h1>
        <p className="text-center text-gray-300 mb-8">欢迎进入Web3世界</p>

        {!isReallyConnected ? (
          <div className="text-center">
            {/* 钱包选择标题 */}
            <p className="text-gray-300 mb-4">选择连接方式</p>

            {/* 钱包按钮容器 */}
            <div className="space-y-3">
              {/* MetaMask 按钮 */}
              <button
                onClick={connectMetaMask}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                <span className="mr-2">🦊</span>
                连接 MetaMask
              </button>

              {/* 其他 钱包按钮 */}
              <button
                onClick={connectOtherWallet}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                <span className="mr-2">🔶</span>
                连接 其他钱包（eg. OKX ）
              </button>

              <div className="text-xs text-gray-400 bg-black/20 p-3 rounded-lg">
                💡 如果无法连接，请：
                <br />
                1. 在OKX钱包中手动断开现有连接
                <br />
                2. 刷新页面后重试
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-4">请确保已安装相应钱包</p>
          </div>
        ) : (
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

              <div className="mt-4 space-y-2">
                <p>
                  余额: {balanceData?.formatted} {balanceData?.symbol}
                </p>
                <p>
                  USDC 余额: {usdcBalanceData?.formatted}{" "}
                  {usdcBalanceData?.symbol}
                </p>
              </div>
            </div>

            {/* 转账组件 */}
            <TransferSection address={address} />

            <button
              onClick={() => disconnect()}
              className="mt-4 bg-gradient-to-r from-gray-600 to-red-600 hover:from-gray-700 hover:to-red-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200"
            >
              断开连接
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>基于 Next.js + Wagmi 构建</p>
      </div>
    </div>
  );
}
