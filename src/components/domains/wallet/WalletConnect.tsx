"use client";
import { useConnect } from "wagmi";
import { useRouter } from "next/navigation";
import { metaMask, injected } from "wagmi/connectors";
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
      // Use wagmi's connector to trigger MetaMask flow; it's more reliable
      // than calling window.ethereum.request directly in some environments.
      const result = await connect({ connector: metaMask() });
      // connect may not throw but still may not connect; use result if available
      // If the connector flow resolved, consider it success and call the callback
      onConnectSuccess();
      return result;
    } catch (error) {
      // Provide a more helpful error message for debugging
      console.error("MetaMask connect error:", error);
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === "object"
          ? JSON.stringify(error)
          : String(error);
      alert("连接失败: " + (msg || "未知错误"));
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
          try {
            // 告知 wagmi 使用 injected 连接器（OKX 也是注入式钱包）
            await connect({ connector: injected() });
          } catch (e) {
            // 如果无法通过 injected() 成功连接（某些环境下可能失败），仍然继续并回退到刷新页面
            console.warn(
              "Failed to register injected connector with wagmi:",
              e
            );
          }

          // 使用 router.refresh() 触发 app-router 刷新并让页面重载连接状态
          setTimeout(() => {
            try {
              router.refresh();
            } catch {
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
