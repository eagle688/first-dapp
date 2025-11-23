// wagmi.ts - 在您现有文件基础上修改
import { createConfig, fallback, http, Transport } from "wagmi";
import { sepolia, polygon, mainnet, bsc, arbitrum } from "wagmi/chains";
import { metaMask, injected, walletConnect } from "wagmi/connectors";

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export function buildWagmiConfig() {
  const getAlchemyTransport = (chainId: number): Transport | undefined => {
    if (!ALCHEMY_KEY) return undefined;

    const chainMap = {
      [mainnet.id]: "eth-mainnet",
      [sepolia.id]: "eth-sepolia",
      [polygon.id]: "polygon-mainnet",
      [arbitrum.id]: "arb-mainnet",
    };

    const alchemyChain = chainMap[chainId as keyof typeof chainMap];
    if (!alchemyChain) return undefined;

    return http(`https://${alchemyChain}.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
      timeout: 10000,
      retryCount: 0,
    });
  };

  return createConfig({
    // 扩展支持的链
    chains: [mainnet, sepolia, polygon, bsc, arbitrum],
    connectors: [
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
      // 新增 WalletConnect 连接器
      ...(WALLETCONNECT_PROJECT_ID
        ? [
            walletConnect({
              projectId: WALLETCONNECT_PROJECT_ID,
              showQrModal: true,
              qrModalOptions: {
                themeVariables: {
                  "--wcm-accent-color": "#7c3aed",
                  "--wcm-background-color": "#1f2937",
                },
              },
            }),
          ]
        : []),
      injected(),
    ],
    transports: {
      [mainnet.id]: fallback(
        [
          getAlchemyTransport(mainnet.id),
          http("https://eth.llamarpc.com"),
          http("https://rpc.ankr.com/eth"),
          http("https://1rpc.io/eth"),
          http("https://cloudflare-eth.com"),
        ].filter((t): t is Transport => !!t)
      ),

      [sepolia.id]: fallback(
        [
          getAlchemyTransport(sepolia.id),
          http("https://1rpc.io/sepolia", {
            timeout: 6000,
            retryCount: 0,
          }),
          http("https://ethereum-sepolia-rpc.publicnode.com", {
            timeout: 8000,
            retryCount: 1,
          }),
        ].filter((t): t is Transport => !!t),
        {
          retryCount: 0,
          rank: false,
        }
      ),

      [polygon.id]: fallback(
        [
          getAlchemyTransport(polygon.id),
          http("https://polygon-rpc.com"),
        ].filter((t): t is Transport => !!t)
      ),

      // 新增 BSC 链配置
      [bsc.id]: fallback(
        [
          http("https://bsc-dataseed.binance.org"),
          http("https://bsc-dataseed1.defibit.io"),
          http("https://bsc-dataseed1.ninicoin.io"),
        ].filter((t): t is Transport => !!t)
      ),

      // 新增 Arbitrum 链配置
      [arbitrum.id]: fallback(
        [
          getAlchemyTransport(arbitrum.id),
          http("https://arb1.arbitrum.io/rpc"),
          http("https://endpoints.omniatech.io/v1/arbitrum/one/public"),
        ].filter((t): t is Transport => !!t)
      ),
    },
  });
}
