import { createConfig, fallback, http, Transport } from "wagmi";
import { sepolia, polygon, mainnet } from "wagmi/chains";
import { metaMask, injected } from "wagmi/connectors";

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";

export function buildWagmiConfig() {
  const getAlchemyTransport = (chainId: number): Transport | undefined => {
    if (!ALCHEMY_KEY) return undefined;

    const chainMap = {
      [mainnet.id]: "eth-mainnet",
      [sepolia.id]: "eth-sepolia",
      [polygon.id]: "polygon-mainnet",
    };

    const alchemyChain = chainMap[chainId as keyof typeof chainMap];
    if (!alchemyChain) return undefined;

    // 使用新的 g.alchemy.com 域名
    return http(`https://${alchemyChain}.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
      timeout: 10000,
      retryCount: 0,
      cacheTime: 5000,
    });
  };

  return createConfig({
    chains: [mainnet, sepolia, polygon],
    connectors: [
      metaMask({
        dappMetadata: {
          name: "My DApp",
          url: "http://localhost:3000",
        },
        enableAnalytics: false,
      }),
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

      // 关键修改：替换 sepolia.drpc.org 为稳定的公共 RPC
      [sepolia.id]: fallback(
        [
          getAlchemyTransport(sepolia.id), // 优先 Alchemy（稳定不超时）
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
          retryCount: 0, // 减少重试次数
          rank: false,
        }
      ),

      [polygon.id]: fallback(
        [
          getAlchemyTransport(polygon.id),
          http("https://polygon-rpc.com"),
        ].filter((t): t is Transport => !!t)
      ),
    },
  });
}
