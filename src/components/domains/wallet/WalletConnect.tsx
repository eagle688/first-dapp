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

  // lightweight provider shape used locally
  type ProviderLike = {
    request?: (args: {
      method: string;
      params?: unknown[];
    }) => Promise<unknown>;
    isMetaMask?: boolean;
  };

  const win =
    typeof window !== "undefined"
      ? (window as unknown as Window & {
          okxwallet?: ProviderLike;
          ethereum?: ProviderLike;
        })
      : undefined;

  const handleConnectMetaMask = async () => {
    try {
      await connect({ connector: metaMask() });
      onConnectSuccess();
    } catch (err) {
      console.error("MetaMask connect error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert("连接失败: " + (msg || "未知错误"));
    }
  };

  const handleConnectOtherWallet = async () => {
    // Prefer calling OKX provider directly in the click handler so ONLY OKX
    // popup opens. Avoid calling generic injected connect before this as that
    // can cause other injected wallets (MetaMask) to prompt too.
    const okx = win?.okxwallet;
    if (okx && typeof okx.request === "function") {
      try {
        const accounts = await okx.request({ method: "eth_requestAccounts" });
        if (Array.isArray(accounts) && accounts.length > 0) {
          // Attempt to register the injected connector with wagmi so
          // wagmi's hooks (useAccount/useBalance/etc.) will observe
          // future account and chain changes. Do this silently — if it
          // fails we still have accounts from OKX above.
          try {
            await connect({ connector: injected() });
          } catch (e) {
            console.warn("silent injected connect failed:", e);
          }

          onConnectSuccess();
          // soft refresh to let app re-detect provider state
          setTimeout(() => {
            try {
              router.refresh();
            } catch {
              if (typeof window !== "undefined") window.location.reload();
            }
          }, 500);
          return;
        }
      } catch (err) {
        console.error("okxwallet.request failed:", err);
        alert("连接失败: " + (err instanceof Error ? err.message : String(err)));
        return;
      }
    }

    alert("未检测到OKX钱包或无法唤起连接弹窗（请确认扩展已启用）");
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
// Fallback: attempt okxwallet.request if available (may be blocked if not
