"use client";
import { useState, useEffect } from "react";
import { useConnect } from "wagmi";
import { useRouter } from "next/navigation";
import { metaMask, injected } from "wagmi/connectors";
import GradientButton from "../../ui/GradientButton";

interface WalletConnectProps {
  onConnectSuccess: () => void;
}

interface DetectedWallet {
  id: string;
  name: string;
  emoji: string;
  type:
    | "metamask"
    | "okx"
    | "coinbase"
    | "tokenpocket"
    | "trust"
    | "bitget"
    | "generic";
}

interface EthereumProvider {
  isMetaMask?: boolean;
  isOKExWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isTokenPocket?: boolean;
  isTrust?: boolean;
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Do not augment the global Window here to avoid conflicts with existing
// definitions from external libs. We use explicit casts for injected props.

export default function WalletConnect({
  onConnectSuccess,
}: WalletConnectProps) {
  const { connect } = useConnect();
  const router = useRouter();
  const [showWalletList, setShowWalletList] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]);

  // 钱包检测逻辑
  useEffect(() => {
    if (typeof window === "undefined") return;

    const wallets: DetectedWallet[] = [];
    const eth = window.ethereum as EthereumProvider | undefined;

    // 检测 MetaMask
    if (eth?.isMetaMask) {
      wallets.push({
        id: "metamask",
        name: "MetaMask",
        emoji: "🦊",
        type: "metamask",
      });
    }

    // 检测 OKX Wallet
    if (
      (window as unknown as Record<string, unknown>).okxwallet ||
      (window as unknown as Record<string, unknown>).okexchain ||
      eth?.isOKExWallet
    ) {
      wallets.push({ id: "okx", name: "OKX Wallet", emoji: "🔶", type: "okx" });
    }

    // 检测 Coinbase Wallet
    if (
      eth?.isCoinbaseWallet ||
      (window as unknown as Record<string, unknown>).coinbaseWalletExtension
    ) {
      wallets.push({
        id: "coinbase",
        name: "Coinbase Wallet",
        emoji: "🔵",
        type: "coinbase",
      });
    }

    // 检测 TokenPocket
    if (
      eth?.isTokenPocket ||
      (window as unknown as Record<string, unknown>).tokenpocket ||
      (window as unknown as Record<string, unknown>).TokenPocket
    ) {
      wallets.push({
        id: "tokenpocket",
        name: "TokenPocket",
        emoji: "🎯",
        type: "tokenpocket",
      });
    }

    // 检测 Trust Wallet
    if (
      eth?.isTrust ||
      (window as unknown as Record<string, unknown>).trustwallet
    ) {
      wallets.push({
        id: "trust",
        name: "Trust Wallet",
        emoji: "💙",
        type: "trust",
      });
    }

    // 检测 Bitget Wallet
    if ((window as unknown as Record<string, unknown>).bitkeep) {
      wallets.push({
        id: "bitget",
        name: "Bitget Wallet",
        emoji: "🟡",
        type: "bitget",
      });
    }

    // 通用钱包检测
    if (eth && !eth.isMetaMask && wallets.length === 0) {
      wallets.push({
        id: "generic",
        name: "检测到的钱包",
        emoji: "🔷",
        type: "generic",
      });
    }

    setDetectedWallets(wallets);
    console.log(
      "检测到的钱包:",
      wallets.map((w) => w.name)
    );
  }, []);

  const handleConnectMetaMask = async () => {
    setConnecting(true);
    try {
      await connect({ connector: metaMask() });
      onConnectSuccess();
      setTimeout(() => router.refresh(), 300);
    } catch (err) {
      console.error("MetaMask 连接错误:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert("MetaMask 连接失败: " + msg);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectOtherWallet = async (wallet: DetectedWallet) => {
    setConnecting(true);
    try {
      console.log(`连接 ${wallet.name}...`);

      // 对于 OKX 钱包，先尝试直接连接
      if (wallet.type === "okx") {
        const okxProvider =
          (window as unknown as Record<string, unknown>).okxwallet ||
          (window as unknown as Record<string, unknown>).okexchain;
        const prov = okxProvider as EthereumProvider | undefined;
        if (prov?.request) {
          try {
            await prov.request({ method: "eth_requestAccounts" });
          } catch (err) {
            console.warn("OKX 直接连接失败:", err);
          }
        }
      }

      // 使用 wagmi 的 injected 连接器
      await connect({ connector: injected() });

      onConnectSuccess();
      setTimeout(() => router.refresh(), 300);
    } catch (err) {
      console.error(`${wallet.name} 连接错误:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`${wallet.name} 连接失败: ${msg}`);
    } finally {
      setConnecting(false);
      setShowWalletList(false);
    }
  };

  const otherWallets = detectedWallets.filter(
    (wallet) => wallet.type !== "metamask"
  );

  return (
    <div className="text-center">
      <p className="text-gray-300 mb-4">选择连接方式</p>
      <div className="space-y-3">
        {/* MetaMask 按钮 */}
        <GradientButton
          onClick={handleConnectMetaMask}
          disabled={connecting}
          fromColor="from-blue-500"
          toColor="to-purple-600"
        >
          <span className="mr-2">🦊</span>
          连接 MetaMask
          {connecting && " (连接中...)"}
        </GradientButton>

        {/* 其他钱包列表 */}
        <div>
          <button
            onClick={() => setShowWalletList(!showWalletList)}
            disabled={otherWallets.length === 0 || connecting}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            <span className="mr-2">🔶</span>
            连接其他钱包 {showWalletList ? "▼" : "▶"}
            {otherWallets.length > 0 && ` (${otherWallets.length})`}
          </button>

          {showWalletList && (
            <div className="mt-2 p-3 bg-white/5 rounded-lg space-y-2 border border-white/10">
              {otherWallets.length > 0 ? (
                otherWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnectOtherWallet(wallet)}
                    disabled={connecting}
                    className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    <span className="mr-2">{wallet.emoji}</span>
                    {wallet.name}
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-400 py-2">
                  未检测到其他钱包
                </div>
              )}
            </div>
          )}
        </div>

        {/* 用户提示 */}
        <div className="text-xs text-gray-400 bg-black/20 p-3 rounded-lg">
          💡 连接提示：
          <br />
          1. 确保已安装相应的钱包扩展
          <br />
          2. 如遇问题，请尝试刷新页面重试
          <br />
          3. 检测到 {detectedWallets.length} 个钱包
        </div>
      </div>
    </div>
  );
}
