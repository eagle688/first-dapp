import { createConfig, fallback, http, Transport } from 'wagmi'
import { sepolia, polygon, mainnet } from 'wagmi/chains'
import { metaMask, injected } from 'wagmi/connectors'

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';

export function buildWagmiConfig() {
  const getAlchemyTransport = (chainId: number): Transport | undefined => {
    if (!ALCHEMY_KEY) return undefined;

    const chainMap = {
      [mainnet.id]: 'eth-mainnet',
      [sepolia.id]: 'eth-sepolia',
      [polygon.id]: 'polygon-mainnet',
    };
    const alchemyChain = chainMap[chainId as keyof typeof chainMap];
    if (!alchemyChain) return undefined;

    return http(`https://${alchemyChain}.alchemyapi.io/v2/${ALCHEMY_KEY}`);
  };

  return createConfig({
    chains: [mainnet, sepolia, polygon],
    connectors: [
      metaMask({
        dappMetadata: {
          name: 'My DApp',
          url: 'http://localhost:3000',
        },
        enableAnalytics: false,
      }),
      injected(),
    ],
    transports: {
      [mainnet.id]: fallback([
        getAlchemyTransport(mainnet.id),
        http('https://eth.llamarpc.com'),
        http('https://rpc.ankr.com/eth'),
        http('https://1rpc.io/eth'),
        http('https://cloudflare-eth.com'),
      ].filter((t): t is Transport => !!t)),

      // 关键修改：替换 sepolia.drpc.org 为稳定的公共 RPC
      [sepolia.id]: fallback([
        getAlchemyTransport(sepolia.id), // 优先 Alchemy（稳定不超时）
        http('https://rpc2.sepolia.org'),
        http('https://ethereum-sepolia-rpc.publicnode.com'),
        http('https://sepolia-pokt.nodies.app'), 
        http('https://sep.rpc.blxrbdn.com'), 
      ].filter((t): t is Transport => !!t)),

      [polygon.id]: fallback([
        getAlchemyTransport(polygon.id),
        http('https://polygon-rpc.com'),
      ].filter((t): t is Transport => !!t)),
    },
  });
}