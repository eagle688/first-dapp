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
    // Preferred: use wagmi injected connector inside the user click handler
    // so the wallet popup is triggered in production (popup must be in a
    // user gesture). This is more reliable than calling provider.request
    // first and then registering with wagmi.
    try {
      console.debug("Attempting connect with injected() for OKX");
      const result = await connect({ connector: injected() });
      console.debug("connect(injected) result:", result);

      // Try to read accounts after connect to confirm authorization
      const okxwallet =
        typeof window !== "undefined"
          ? ((window as unknown as Record<string, unknown>)
              .okxwallet as unknown as {
              request?: (args: { method: string }) => Promise<unknown>;
            })
          : undefined;
      let accounts: unknown = null;
      try {
        if (okxwallet && typeof okxwallet.request === "function") {
          accounts = await okxwallet.request({ method: "eth_accounts" });
        } else if (
          (window as unknown as Record<string, unknown>).ethereum &&
          typeof (window as unknown as Record<string, unknown>).ethereum ===
            "object"
        ) {
          const eth = (window as unknown as Record<string, unknown>)
            .ethereum as unknown as {
            request?: (args: { method: string }) => Promise<unknown>;
          };
          if (eth.request)
            accounts = await eth.request({ method: "eth_accounts" });
        }
      } catch (e) {
        console.warn("Failed to read accounts after injected connect:", e);
      }

      console.debug("accounts after injected connect:", accounts);

      if (Array.isArray(accounts) ? accounts[0] : true) {
        onConnectSuccess();
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
      console.warn("connect(injected) threw:", err);
    }

    // Fallback: attempt okxwallet.request if available (may be blocked if not
    // in a user gesture). If it succeeds, register injected() with wagmi and
    // refresh.
    const okxwallet =
      typeof window !== "undefined"
        ? ((window as unknown as Record<string, unknown>)
            .okxwallet as unknown as {
            request?: (args: { method: string }) => Promise<unknown>;
          })
        : undefined;
    if (okxwallet && typeof okxwallet.request === "function") {
      try {
        const accounts = await okxwallet.request({
          method: "eth_requestAccounts",
        });
        if (Array.isArray(accounts) && accounts[0]) {
          try {
            await connect({ connector: injected() });
          } catch (e) {
            console.warn(
              "Failed to register injected connector with wagmi:",
              e
            );
          }
          onConnectSuccess();
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
        console.error("okxwallet.request fallback failed:", err);
        alert(
          "连接失败: " + (err instanceof Error ? err.message : String(err))
        );
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
