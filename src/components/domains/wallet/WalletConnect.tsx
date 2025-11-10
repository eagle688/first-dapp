"use client";
import { useConnect, useDisconnect } from "wagmi";
import { metaMask, injected } from "wagmi/connectors";
import GradientButton from "../../ui/GradientButton";

interface WalletConnectProps {
  onConnectSuccess: () => void;
}

export default function WalletConnect({
  onConnectSuccess,
}: WalletConnectProps) {
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const connectMetaMask = () => {
    connect({ connector: metaMask() });
  };

  const connectOtherWallet = async () => {
    if (window.okxwallet) {
      try {
        disconnect();
        const accounts = await window.okxwallet.request<string[]>({
          method: "eth_requestAccounts",
        });

        if (accounts?.[0]) {
          connect({ connector: injected() });
          onConnectSuccess();
        }
      } catch (error) {
        alert(
          "连接失败: " + (error instanceof Error ? error.message : "未知错误")
        );
      }
    } else {
      alert("未检测到OKX钱包");
    }
  };

  return (
    <div className="text-center">
      <p className="text-gray-300 mb-4">选择连接方式</p>
      <div className="space-y-3">
        <GradientButton
          onClick={connectMetaMask}
          fromColor="from-blue-500"
          toColor="to-purple-600"
        >
          <span className="mr-2">🦊</span>
          连接 MetaMask
        </GradientButton>

        <GradientButton
          onClick={connectOtherWallet}
          fromColor="from-green-500"
          toColor="to-blue-600"
        >
          <span className="mr-2">🔶</span>
          连接其他钱包（eg. OKX）
        </GradientButton>

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
  );
}
