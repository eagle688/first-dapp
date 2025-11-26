// hooks/useWalletDetection.ts
import { useMemo } from "react";
import { DetectedWallet } from "../types/wallet";
import { EthereumProvider, WindowWithWallets } from "../types/ethereum";

export function useWalletDetection() {
  const detectedWallets = useMemo(() => {
    const win =
      typeof window !== "undefined" ? (window as WindowWithWallets) : undefined;

    if (!win) {
      return [];
    }

    const wallets: DetectedWallet[] = [];
    const { ethereum } = win;
    const allProviders: Partial<EthereumProvider>[] = [];

    // 收集所有 Provider（保持您现有的检测逻辑）
    if (ethereum) {
      if (Array.isArray(ethereum.providers)) {
        allProviders.push(...ethereum.providers);
      } else {
        allProviders.push(ethereum);
      }
    }

    if (win.okxwallet) allProviders.push(win.okxwallet);
    if (win.okexchain) allProviders.push(win.okexchain);
    if (win.coinbaseWalletExtension)
      allProviders.push(win.coinbaseWalletExtension);
    if (win.tokenpocket) allProviders.push(win.tokenpocket);
    if (win.TokenPocket) allProviders.push(win.TokenPocket);
    if (win.trustwallet) allProviders.push(win.trustwallet);
    if (win.bitkeep) allProviders.push(win.bitkeep);

    // 钱包类型检测逻辑（保持您现有的逻辑）
    allProviders.forEach((provider) => {
      if (provider.isMetaMask && !wallets.some((w) => w.type === "metamask")) {
        wallets.push({
          id: "metamask",
          name: "MetaMask",
          emoji: "🦊",
          type: "metamask",
          provider,
        });
      } else if (
        (provider.isOKExWallet || win?.okxwallet === provider) &&
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
      // ... 其他钱包类型的检测（保持您现有的逻辑）
    });

    if (win.bitkeep && !wallets.some((w) => w.type === "bitget")) {
      wallets.push({
        id: "bitget",
        name: "Bitget Wallet",
        emoji: "🟡",
        type: "bitget",
        provider: win.bitkeep,
      });
    }

    if (ethereum && wallets.length === 0) {
      wallets.push({
        id: "generic",
        name: "检测到的钱包",
        emoji: "🔷",
        type: "generic",
        provider: ethereum,
      });
    }

    return wallets;
  }, []);

  return { detectedWallets };
}
