"use client";
import { useConnect } from "wagmi";
import { useRouter } from "next/navigation";
import { metaMask } from "wagmi/connectors";
import GradientButton from "../../ui/GradientButton";

interface WalletConnectProps {
  onConnectSuccess: () => void;
}

export default function WalletConnect({
  onConnectSuccess,
}: WalletConnectProps) {
  const { connect } = useConnect();
  const router = useRouter();

  const handleConnectMetaMask = async () => {
    try {
      // 直接调用 MetaMask，不通过 wagmi connector
      const ethereum =
        typeof window !== "undefined"
          ? (window as unknown as Record<string, unknown>).ethereum
          : undefined;
      if (
        ethereum &&
        typeof ethereum === "object" &&
        "isMetaMask" in ethereum &&
        "request" in ethereum
      ) {
        const request = (
          ethereum as unknown as {
            request: (args: { method: string }) => Promise<unknown>;
          }
        ).request;
        const accounts = await request({
          method: "eth_requestAccounts",
        });
        if (Array.isArray(accounts) && accounts[0]) {
          connect({ connector: metaMask() });
          onConnectSuccess();
        }
      } else {
        alert("未检测到 MetaMask");
      }
    } catch (error) {
      alert(
        "连接失败: " + (error instanceof Error ? error.message : "未知错误")
      );
    }
  };

  const handleConnectOtherWallet = async () => {
    const okxwallet =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).okxwallet
        : undefined;
    if (okxwallet && typeof okxwallet === "object" && "request" in okxwallet) {
      try {
        const request = (
          okxwallet as unknown as {
            request: (args: { method: string }) => Promise<unknown>;
          }
        ).request;
        const accounts = await request({
          method: "eth_requestAccounts",
        });

        if (Array.isArray(accounts) && accounts[0]) {
          // 使用 OKX 钱包后，触发 app-router 的刷新以重新初始化 wagmi
          // 使用 router.refresh() 避免强制完整页面 reload，能在 Vercel/SSR 环境下正确触发重新获取服务端数据
          setTimeout(() => {
            try {
              router.refresh();
            } catch {
              // 回退到 window.reload 如果 router.refresh 不可用（保守做法）
              // 这里不抛出异常，保证用户仍然能在旧的环境下得到刷新效果
              if (typeof window !== "undefined") window.location.reload();
            }
          }, 500);
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
          onClick={handleConnectMetaMask}
          fromColor="from-blue-500"
          toColor="to-purple-600"
        >
          <span className="mr-2">🦊</span>
          连接 MetaMask
        </GradientButton>

        <GradientButton
          onClick={handleConnectOtherWallet}
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
