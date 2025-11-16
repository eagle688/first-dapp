"use client";
import { useState } from "react";
import { useConnect } from "wagmi";
import { useRouter } from "next/navigation";
import { metaMask, injected } from "wagmi/connectors";
import GradientButton from "../../ui/GradientButton";

interface WalletConnectProps {
  onConnectSuccess: () => void;
}

// Wallet provider detection and names
interface WalletProvider {
  key: string;
  name: string;
  emoji: string;
  detect: () => boolean;
  provider: () => unknown;
}

const WALLET_PROVIDERS: WalletProvider[] = [
  {
    key: "okx",
    name: "OKX Wallet",
    emoji: "🔶",
    detect: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as Record<string, unknown>).okxwallet,
    provider: () => (window as unknown as Record<string, unknown>).okxwallet,
  },
  {
    key: "coinbase",
    name: "Coinbase Wallet",
    emoji: "🔵",
    detect: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as Record<string, unknown>).coinbaseWalletExtension,
    provider: () =>
      (window as unknown as Record<string, unknown>).coinbaseWalletExtension,
  },
  {
    key: "tokenpocket",
    name: "TokenPocket",
    emoji: "🎯",
    detect: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as Record<string, unknown>).TokenPocket,
    provider: () => {
      const tp = (window as unknown as Record<string, unknown>)
        .TokenPocket as Record<string, unknown>;
      return (tp?.provider as Record<string, unknown>)?.ethereum;
    },
  },
  {
    key: "trust",
    name: "Trust Wallet",
    emoji: "💙",
    detect: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as Record<string, unknown>).trustwallet,
    provider: () => (window as unknown as Record<string, unknown>).trustwallet,
  },
  {
    key: "wallet_connect",
    name: "WalletConnect",
    emoji: "🔗",
    detect: () => true, // Always available via wagmi
    provider: () => null, // Uses wagmi connector
  },
];

export default function WalletConnect({
  onConnectSuccess,
}: WalletConnectProps) {
  const { connect } = useConnect();
  const router = useRouter();
  const [showWalletList, setShowWalletList] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Get available wallets
  const availableWallets = WALLET_PROVIDERS.filter((w) => w.detect());

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

  const handleConnectInjectedWallet = async (walletKey: string) => {
    setConnecting(true);
    try {
      const walletDef = WALLET_PROVIDERS.find((w) => w.key === walletKey);
      if (!walletDef) {
        alert("钱包配置错误");
        return;
      }

      if (walletKey === "wallet_connect") {
        // Use wagmi for WalletConnect
        await connect({ connector: injected() });
      } else {
        // For injected providers (OKX, Coinbase, TokenPocket, Trust)
        const provider = walletDef.provider();
        const providerObj = provider as Record<string, unknown> | null;
        if (!providerObj || typeof providerObj.request !== "function") {
          alert(`${walletDef.name} 未检测到或无法唤起连接弹窗`);
          return;
        }

        // Call provider directly to get accounts
        const accounts = await (
          providerObj.request as (
            arg: Record<string, unknown>
          ) => Promise<unknown>
        )({
          method: "eth_requestAccounts",
        });

        if (Array.isArray(accounts) && accounts.length > 0) {
          // Register injected connector with wagmi
          try {
            await connect({ connector: injected() });
          } catch (e) {
            console.warn("silent injected connect failed:", e);
          }

          onConnectSuccess();
          // Soft refresh
          setTimeout(() => {
            try {
              router.refresh();
            } catch {
              if (typeof window !== "undefined") window.location.reload();
            }
          }, 500);
          return;
        }
      }

      onConnectSuccess();
    } catch (err) {
      console.error(`${walletKey} connect error:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      alert("连接失败: " + (msg || "未知错误"));
    } finally {
      setConnecting(false);
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

        <div>
          <button
            onClick={() => setShowWalletList(!showWalletList)}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all"
          >
            <span className="mr-2">🔶</span>
            连接其他钱包 {showWalletList ? "▼" : "▶"}
          </button>

          {showWalletList && availableWallets.length > 1 && (
            <div className="mt-2 p-3 bg-white/5 rounded-lg space-y-2 border border-white/10">
              {availableWallets
                .filter((w) => w.key !== "wallet_connect") // Hide redundant option
                .map((wallet) => (
                  <button
                    key={wallet.key}
                    onClick={() => {
                      handleConnectInjectedWallet(wallet.key);
                      setShowWalletList(false);
                    }}
                    disabled={connecting}
                    className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-all disabled:opacity-50"
                  >
                    <span className="mr-2">{wallet.emoji}</span>
                    {wallet.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 bg-black/20 p-3 rounded-lg">
          💡 如果无法连接，请：
          <br />
          1. 确保已安装相应的钱包扩展
          <br />
          2. 在钱包中手动断开现有连接
          <br />
          3. 刷新页面后重试
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-4">请确保已安装相应钱包</p>
    </div>
  );
}
