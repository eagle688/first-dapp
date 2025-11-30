// hooks/useOtherWalletConnection.ts
import { useState } from "react";
import { useConnect, useConnection, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { DetectedWallet } from "../types/wallet";
import { EthereumProvider, WindowWithWallets } from "../types/ethereum";

const win =
  typeof window !== "undefined" ? (window as WindowWithWallets) : undefined;

// 补全 Provider 的工具函数
const completeProvider = (
  provider: Partial<EthereumProvider>
): EthereumProvider => {
  const defaultRequest = async (_args: {
    method: string;
    params?: unknown[];
  }) => {
    void _args;
    throw new Error("Provider request 方法未实现");
  };

  return {
    isMetaMask: provider.isMetaMask ?? false,
    isOKExWallet: provider.isOKExWallet ?? false,
    isCoinbaseWallet: provider.isCoinbaseWallet ?? false,
    isTokenPocket: provider.isTokenPocket ?? false,
    isTrust: provider.isTrust ?? false,
    accounts: provider.accounts ?? [],
    chainId: provider.chainId ?? "0x1",
    providers: provider.providers ?? [],
    request: provider.request ?? defaultRequest,
    on:
      provider.on ??
      ((..._args: unknown[]) => {
        void _args;
      }),
    removeListener:
      provider.removeListener ??
      ((..._args: unknown[]) => {
        void _args;
      }),
  };
};

export function useOtherWalletConnection(onConnectSuccess: () => void) {
  const { connect } = useConnect();
  const { address: currentAddress } = useConnection();
  const { disconnect } = useDisconnect();
  const [connecting, setConnecting] = useState(false);

  const handleConnectOtherWallet = async (wallet: DetectedWallet) => {
    setConnecting(true);
    try {
      console.log(`开始连接 ${wallet.name}...`);

      // 连接前断开已有连接
      if (currentAddress) await disconnect();

      // 特殊处理 OKX 钱包（解决多钱包共存问题）
      if (wallet.type === "okx" && wallet.provider) {
        const partialOkxProvider = wallet.provider as Partial<EthereumProvider>;
        const completeOkxProvider = completeProvider(partialOkxProvider);

        // 通过 OKX 原生 Provider 授权
        const accounts = await completeOkxProvider.request!({
          method: "eth_requestAccounts",
        });
        if (!Array.isArray(accounts) || accounts.length === 0) {
          throw new Error("未获取到 OKX 钱包账户");
        }

        // 备份原始 ethereum
        if (win && !win._originalEthereum && win.ethereum) {
          win._originalEthereum = { ...win.ethereum };
        }

        // 安全覆盖 window.ethereum
        if (win) {
          const safeOkxProvider =
            completeOkxProvider as WindowWithWallets["ethereum"];
          if (safeOkxProvider) {
            safeOkxProvider.isMetaMask = false;
            safeOkxProvider.isOKExWallet = true;
            safeOkxProvider.accounts = accounts as string[];
            safeOkxProvider.providers = [safeOkxProvider];
          }
          win.ethereum = safeOkxProvider;
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      // 使用 Wagmi injected 连接器连接
      await connect({ connector: injected() });
      onConnectSuccess();
    } catch (err) {
      console.error(`${wallet.name} 连接错误:`, err);
      const msg =
        err instanceof Error
          ? err.message.includes("user rejected")
            ? "用户拒绝授权"
            : err.message
          : "未知错误";
      alert(`${wallet.name} 连接失败: ${msg}`);
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  return {
    handleConnectOtherWallet,
    connecting,
  };
}
