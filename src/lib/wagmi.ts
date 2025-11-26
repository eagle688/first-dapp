// wagmi.ts - 完整配置
import { createConfig, fallback, http, Transport } from "wagmi";
import { sepolia, polygon, mainnet, bsc, arbitrum } from "wagmi/chains";
import { metaMask, injected } from "wagmi/connectors";
import { createWalletConnectConnector } from "./walletConnectFix";

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// 配置验证和调试
console.log("🔧 环境变量检查:", {
  hasAlchemyKey: !!ALCHEMY_KEY,
  alchemyKeyLength: ALCHEMY_KEY.length,
  hasWalletConnectId: !!WALLETCONNECT_PROJECT_ID,
  walletConnectIdLength: WALLETCONNECT_PROJECT_ID.length,
  isDefaultWalletConnectId:
    WALLETCONNECT_PROJECT_ID === "your_actual_walletconnect_project_id_here",
});

export function buildWagmiConfig() {
  const getAlchemyTransport = (chainId: number): Transport | undefined => {
    if (!ALCHEMY_KEY) {
      console.warn(`⚠️ Alchemy API Key 未配置，链 ${chainId} 将使用公共 RPC`);
      return undefined;
    }

    const chainMap = {
      [mainnet.id]: "eth-mainnet",
      [sepolia.id]: "eth-sepolia",
      [polygon.id]: "polygon-mainnet",
      [arbitrum.id]: "arb-mainnet",
    };

    const alchemyChain = chainMap[chainId as keyof typeof chainMap];
    if (!alchemyChain) {
      console.warn(`⚠️ 链 ${chainId} 不支持 Alchemy，使用公共 RPC`);
      return undefined;
    }

    return http(`https://${alchemyChain}.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
      timeout: 10000,
      retryCount: 2,
    });
  };

  const connectors = [
    metaMask({
      dappMetadata: {
        name: "My DApp",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000",
      },
      enableAnalytics: false,
    }),
    injected({
      shimDisconnect: true,
    }),
  ];

  // 尝试添加 WalletConnect，如果失败则跳过
  try {
    const walletConnectConnector = createWalletConnectConnector();
    connectors.push(walletConnectConnector);
    console.log("✅ WalletConnect 连接器已加载");
  } catch (error) {
    console.warn("🚫 WalletConnect 连接器加载失败:", error);
  }

  // 传输层配置
  const transports = {
    // Ethereum 主网
    [mainnet.id]: fallback(
      [
        getAlchemyTransport(mainnet.id),
        http("https://eth.llamarpc.com", { timeout: 8000 }),
        http("https://rpc.ankr.com/eth", { timeout: 8000 }),
        http("https://1rpc.io/eth", { timeout: 8000 }),
        http("https://cloudflare-eth.com", { timeout: 10000 }),
      ].filter((t): t is Transport => !!t),
      { retryCount: 1 }
    ),

    // Sepolia 测试网

    [sepolia.id]: fallback(
      [
        getAlchemyTransport(sepolia.id), // Alchemy（推荐，稳定且支持CORS）
        http("https://sepolia.gateway.tenderly.co"), // Tenderly（支持CORS）
        http("https://ethereum-sepolia-rpc.publicnode.com"), // PublicNode（支持CORS）
        http("https://rpc.sepolia.org", {
          timeout: 8000,
          retryCount: 1,
        }), // 备用
      ].filter((t): t is Transport => !!t),
      {
        retryCount: 1,
        rank: false,
      }
    ),

    // Polygon 主网
    [polygon.id]: fallback(
      [
        getAlchemyTransport(polygon.id),
        http("https://polygon-rpc.com", { timeout: 8000 }),
        http("https://rpc-mainnet.matic.quiknode.pro", { timeout: 8000 }),
        http("https://polygon-bor-rpc.publicnode.com", { timeout: 8000 }),
      ].filter((t): t is Transport => !!t),
      { retryCount: 1 }
    ),

    // BSC 主网
    [bsc.id]: fallback(
      [
        http("https://bsc-dataseed.binance.org", { timeout: 8000 }),
        http("https://bsc-dataseed1.defibit.io", { timeout: 8000 }),
        http("https://bsc-dataseed1.ninicoin.io", { timeout: 8000 }),
        http("https://bsc-rpc.publicnode.com", { timeout: 8000 }),
      ].filter((t): t is Transport => !!t),
      { retryCount: 1 }
    ),

    // Arbitrum 主网
    [arbitrum.id]: fallback(
      [
        getAlchemyTransport(arbitrum.id),
        http("https://arb1.arbitrum.io/rpc", { timeout: 8000 }),
        http("https://endpoints.omniatech.io/v1/arbitrum/one/public", {
          timeout: 8000,
        }),
        http("https://arbitrum-one-rpc.publicnode.com", { timeout: 8000 }),
      ].filter((t): t is Transport => !!t),
      { retryCount: 1 }
    ),
  };

  // 创建最终配置
  const config = createConfig({
    chains: [mainnet, sepolia, polygon, bsc, arbitrum],
    connectors,
    transports,
    ssr: true, // 启用 SSR 支持
  });

  console.log("🎉 Wagmi 配置创建成功", {
    chains: config.chains.map((chain) => chain.name),
    connectors: config.connectors.map((connector) => connector.name),
    hasWalletConnect: connectors.some(
      (connector) => connector.name === "WalletConnect"
    ),
  });

  return config;
}

// 导出配置实例
export const wagmiConfig = buildWagmiConfig();
