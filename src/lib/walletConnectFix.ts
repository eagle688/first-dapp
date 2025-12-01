// lib/walletConnectFix.ts
import { walletConnect } from "wagmi/connectors";

export function createWalletConnectConnector() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  if (!projectId || projectId === "your_actual_project_id_here") {
    throw new Error("WalletConnect Project ID 未配置");
  }

  return walletConnect({
    projectId,
    showQrModal: true,
    qrModalOptions: {
      themeVariables: {
        "--wcm-z-index": "9999",
        "--wcm-accent-color": "#7c3aed",
        "--wcm-background-color": "#1f2937",
      },
      enableExplorer: true,
      explorerExcludedWalletIds: "ALL",
      explorerRecommendedWalletIds: [
        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
        "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
      ],
    },
    metadata: {
      name: "My DApp",
      description: "My DApp Description",
      url:
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });
}
