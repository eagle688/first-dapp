"use client";
import { useState, useEffect } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
// router not used here; avoid importing to satisfy TS
import { metaMask, injected } from "wagmi/connectors";
import GradientButton from "../../ui/GradientButton";

// 组件 Props 定义
interface WalletConnectProps {
  onConnectSuccess: () => void;
}

// 检测到的钱包类型
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
  provider?: unknown; // 存储对应钱包的 Provider
}

// EIP-1193 标准 Provider 完整类型（包含必需属性）
interface EthereumProvider {
  isMetaMask?: boolean;
  isOKExWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isTokenPocket?: boolean;
  isTrust?: boolean;
  request?: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>; // 可选通用方法
  on: (event: string, listener: (...args: unknown[]) => void) => void; // 必需方法（状态监听）
  removeListener: (
    event: string,
    listener: (...args: unknown[]) => void
  ) => void; // 必需方法
  accounts?: string[];
  chainId?: string;
  providers?: EthereumProvider[]; // 多 Provider 支持
}

// 扩展 Window 类型，支持多钱包 Provider 识别
type WindowWithWallets = Window & {
  ethereum?: EthereumProvider;
  okxwallet?: Partial<EthereumProvider>; // OKX 钱包可能是部分实现
  okexchain?: Partial<EthereumProvider>; // OKX 旧版兼容
  coinbaseWalletExtension?: Partial<EthereumProvider>;
  tokenpocket?: Partial<EthereumProvider>;
  TokenPocket?: Partial<EthereumProvider>;
  trustwallet?: Partial<EthereumProvider>;
  bitkeep?: Partial<EthereumProvider>;
  _originalEthereum?: EthereumProvider; // 备份原始 ethereum（用于恢复）
};

// 全局 Window 实例（带类型断言）
const win =
  typeof window !== "undefined" ? (window as WindowWithWallets) : undefined;

// Helper: detect MetaMask 'request already pending' RPC error
const isPermissionRequestPendingError = (err: unknown) => {
  try {
    const e = err as Record<string, unknown> | undefined;
    const code = e?.["code"] as number | undefined;
    const message = e?.["message"] as string | undefined;
    return !!(code === -32002 || (message && message.includes("already pending")));
  } catch {
    return false;
  }
};

// 补全 Provider 缺失的必需方法（容错用）
const completeProvider = (
  provider: Partial<EthereumProvider>
): EthereumProvider => {
  const defaultRequest = async (_args: { method: string; params?: unknown[] }) => {
    void _args;
    throw new Error("Provider request 方法未实现");
  };

  return {
    // 保留原有属性
    isMetaMask: provider.isMetaMask ?? false,
    isOKExWallet: provider.isOKExWallet ?? false,
    isCoinbaseWallet: provider.isCoinbaseWallet ?? false,
    isTokenPocket: provider.isTokenPocket ?? false,
    isTrust: provider.isTrust ?? false,
    accounts: provider.accounts ?? [],
    chainId: provider.chainId ?? "0x1",
    providers: provider.providers ?? [],
    // 补全必需方法（避免 Wagmi 调用失败）
    request: provider.request ?? defaultRequest,
    on:
      provider.on ?? ((..._args: unknown[]) => {
        void _args;
      }), // 默认空实现，引用参数以避免 TS noUnused 参数
    removeListener:
      provider.removeListener ?? ((..._args: unknown[]) => {
        void _args;
      }), // 默认空实现
  };
};

export default function WalletConnect({
  onConnectSuccess,
}: WalletConnectProps) {
  const { connect } = useConnect(); // Wagmi v2 连接方法
  const { address: currentAddress } = useAccount(); // 当前连接地址
  const { disconnect } = useDisconnect(); // 断开连接方法
  // router removed — we rely on parent to refresh if needed
  const [showWalletList, setShowWalletList] = useState(false); // 其他钱包列表展开状态
  const [connecting, setConnecting] = useState(false); // 连接中状态（统一控制）
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]); // 检测到的钱包列表

  // 组件卸载时恢复原始 ethereum（可选，提升用户体验）
  useEffect(() => {
    return () => {
      if (win && win._originalEthereum) {
        // 仅在用户未连接钱包时恢复（避免覆盖当前连接状态）
        if (!currentAddress) {
          (win as unknown as Record<string, unknown>)["ethereum"] = win._originalEthereum as unknown;
          delete (win as unknown as Record<string, unknown>)["_originalEthereum"]; // 清除备份
        }
      }
    };
  }, [currentAddress]);

  // 1. 钱包检测逻辑（组件挂载时执行）
  useEffect(() => {
    if (!win) return;

    const wallets: DetectedWallet[] = [];
    const { ethereum } = win;
    const allProviders: Partial<EthereumProvider>[] = [];

    // 收集所有可能的 Provider（处理多钱包共存）
    if (ethereum) {
      if (Array.isArray(ethereum.providers)) {
        allProviders.push(...ethereum.providers); // 多 Provider 场景（如 MetaMask + OKX）
      } else {
        allProviders.push(ethereum); // 单 Provider 场景
      }
    }

    // 补充单独注入的钱包 Provider（部分钱包不会加入 ethereum.providers）
    if (win.okxwallet) allProviders.push(win.okxwallet);
    if (win.okexchain) allProviders.push(win.okexchain);
    if (win.coinbaseWalletExtension)
      allProviders.push(win.coinbaseWalletExtension);
    if (win.tokenpocket) allProviders.push(win.tokenpocket);
    if (win.TokenPocket) allProviders.push(win.TokenPocket);
    if (win.trustwallet) allProviders.push(win.trustwallet);
    if (win.bitkeep) allProviders.push(win.bitkeep);

    // 遍历 Provider，匹配对应钱包类型
    allProviders.forEach((provider) => {
      // MetaMask
      if (provider.isMetaMask && !wallets.some((w) => w.type === "metamask")) {
        wallets.push({
          id: "metamask",
          name: "MetaMask",
          emoji: "🦊",
          type: "metamask",
          provider,
        });
      }
      // OKX 钱包（兼容新旧版本标识）
      else if (
        (provider.isOKExWallet || win.okxwallet === provider) &&
        !wallets.some((w) => w.type === "okx")
      ) {
        wallets.push({
          id: "okx",
          name: "OKX Wallet",
          emoji: "🔶",
          type: "okx",
          provider,
        });
      }
      // Coinbase Wallet
      else if (
        provider.isCoinbaseWallet &&
        !wallets.some((w) => w.type === "coinbase")
      ) {
        wallets.push({
          id: "coinbase",
          name: "Coinbase Wallet",
          emoji: "🔵",
          type: "coinbase",
          provider,
        });
      }
      // TokenPocket
      else if (
        provider.isTokenPocket &&
        !wallets.some((w) => w.type === "tokenpocket")
      ) {
        wallets.push({
          id: "tokenpocket",
          name: "TokenPocket",
          emoji: "🎯",
          type: "tokenpocket",
          provider,
        });
      }
      // Trust Wallet
      else if (provider.isTrust && !wallets.some((w) => w.type === "trust")) {
        wallets.push({
          id: "trust",
          name: "Trust Wallet",
          emoji: "💙",
          type: "trust",
          provider,
        });
      }
    });

    // Bitget Wallet（单独处理，部分版本标识特殊）
    if (win.bitkeep && !wallets.some((w) => w.type === "bitget")) {
      wallets.push({
        id: "bitget",
        name: "Bitget Wallet",
        emoji: "🟡",
        type: "bitget",
        provider: win.bitkeep,
      });
    }

    // 通用钱包（未匹配到特定钱包时）
    if (ethereum && wallets.length === 0) {
      wallets.push({
        id: "generic",
        name: "检测到的钱包",
        emoji: "🔷",
        type: "generic",
        provider: ethereum,
      });
    }

    setDetectedWallets(wallets);
    console.log(
      "检测到的钱包:",
      wallets.map((w) => w.name)
    );
  }, []);

  // 2. MetaMask 专属连接逻辑
  const handleConnectMetaMask = async () => {
    setConnecting(true);
    try {
      // 连接前断开已有连接，避免状态冲突
      if (currentAddress) await disconnect();
      // 恢复原始 ethereum（若有备份），确保 MetaMask 能被正确识别
      if (win && win._originalEthereum) {
  (win as unknown as Record<string, unknown>)["ethereum"] = win._originalEthereum as unknown;
  delete (win as unknown as Record<string, unknown>)["_originalEthereum"];
      }
      // Wagmi v2 原生连接 MetaMask
      await connect({ connector: metaMask() });
      onConnectSuccess();
    } catch (err) {
      console.error("MetaMask 连接错误:", err);
      // 错误提示优化（区分用户拒绝和其他错误）
      const msg =
        err instanceof Error
          ? err.message.includes("user rejected")
            ? "用户拒绝授权"
            : err.message.includes("No Ethereum provider found")
            ? "未检测到 MetaMask 钱包，请安装后重试"
            : err.message
          : "未知错误";
      alert(`MetaMask 连接失败: ${msg}`);
    } finally {
      setConnecting(false); // 无论成败，关闭连接中状态
    }
  };

  // 3. 其他钱包连接逻辑（重点处理 OKX 多钱包冲突）
  const handleConnectOtherWallet = async (wallet: DetectedWallet) => {
    setConnecting(true);
    try {
      console.log(`开始连接 ${wallet.name}...`);
      // 连接前断开已有连接，清除旧状态
      if (currentAddress) await disconnect();

      // 特殊处理 OKX 钱包（解决多钱包共存时优先唤起 MetaMask 的问题）
      if (wallet.type === "okx" && wallet.provider) {
        // 步骤1：补全 Provider 必需属性（避免缺失方法导致报错）
        const partialOkxProvider = wallet.provider as Partial<EthereumProvider>;

        const completeOkxProvider = completeProvider(partialOkxProvider);

        // 步骤2：通过 OKX 原生 Provider 授权（确保用户已允许）
        const accounts = await completeOkxProvider.request!({
          method: "eth_requestAccounts",
        });
        if (!Array.isArray(accounts) || accounts.length === 0) {
          throw new Error("未获取到 OKX 钱包账户");
        }
        console.log("OKX 原生授权成功，账户:", accounts[0]);

        // 步骤3：备份原始 ethereum（便于后续恢复）
        if (win && !win._originalEthereum && win.ethereum) {
          win._originalEthereum = { ...win.ethereum }; // 浅拷贝备份
        }

        // 步骤4：安全覆盖 window.ethereum（核心优化）
        if (win) {
          // 严格类型断言，确保类型兼容
          const safeOkxProvider =
            completeOkxProvider as WindowWithWallets["ethereum"];

          if (safeOkxProvider) {
            // 强制标记为 OKX 钱包，排除 MetaMask 干扰
            safeOkxProvider.isMetaMask = false;
            safeOkxProvider.isOKExWallet = true;
            safeOkxProvider.accounts = accounts as string[];
            safeOkxProvider.providers = [safeOkxProvider]; // 仅保留 OKX Provider
          }

          // 最终赋值（此时 Provider 已完整且类型安全）
          win.ethereum = safeOkxProvider;

          // 延迟 150ms 确保 Provider 替换生效（极端场景兼容）
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      // 步骤5：使用 Wagmi injected 连接器连接（此时已优先识别目标钱包）
      await connect({ connector: injected() });

      console.log("Wagmi 连接成功，当前地址:", currentAddress);
      onConnectSuccess();
    } catch (err) {
      console.error(`${wallet.name} 连接错误:`, err);
      // 错误提示优化
      const msg =
        err instanceof Error
          ? err.message.includes("user rejected")
            ? "用户拒绝授权"
            : err.message
          : "未知错误";
      alert(`${wallet.name} 连接失败: ${msg}`);
    } finally {
      setConnecting(false);
      setShowWalletList(false); // 关闭钱包列表
    }
  };

  // 过滤出非 MetaMask 的其他钱包
  const otherWallets = detectedWallets.filter(
    (wallet) => wallet.type !== "metamask"
  );

  return (
    <div className="text-center">
      <p className="text-gray-300 mb-4">选择连接方式</p>
      <div className="space-y-3">
        {/* MetaMask 连接按钮 */}
        <GradientButton
          onClick={handleConnectMetaMask}
          disabled={connecting}
          fromColor="from-blue-500"
          toColor="to-purple-600"
          className="w-full"
        >
          <span className="mr-2">🦊</span>
          连接 MetaMask
          {connecting && " (连接中...)"}
        </GradientButton>

        {/* 其他钱包展开按钮 */}
        <div>
          <button
            onClick={() => setShowWalletList(!showWalletList)}
            disabled={otherWallets.length === 0 || connecting}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <span className="mr-2">🔶</span>
            连接其他钱包 {showWalletList ? "▼" : "▶"}
            {otherWallets.length > 0 && ` (${otherWallets.length})`}
          </button>

          {/* 其他钱包列表（展开时显示） */}
          {showWalletList && (
            <div className="mt-2 p-3 bg-white/5 rounded-lg space-y-2 border border-white/10">
              {otherWallets.length > 0 ? (
                otherWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnectOtherWallet(wallet)}
                    disabled={connecting}
                    className="w-full px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{wallet.emoji}</span>
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

        {/* 连接提示说明 */}
        <div className="text-xs text-gray-400 bg-black/20 p-3 rounded-lg">
          💡 连接提示：
          <br />
          1. 确保已安装相应钱包扩展并登录
          <br />
          2. 切换钱包前会自动断开当前连接，避免冲突
          <br />
          3. 检测到 {detectedWallets.length} 个钱包
          {currentAddress &&
            ` | 当前地址: ${currentAddress.slice(
              0,
              6
            )}...${currentAddress.slice(-4)}`}
        </div>
      </div>
    </div>
  );
}
