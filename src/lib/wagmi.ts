 
import { createConfig, fallback, http } from 'wagmi'
import { sepolia, polygon, mainnet } from 'wagmi/chains'
import { metaMask, injected } from 'wagmi/connectors'

// Export a factory so the connectors (which may touch window) are only
// created on the client when the function is called inside a client component.
export function buildWagmiConfig() {
  return createConfig({
    chains: [mainnet, sepolia, polygon],
    connectors: [
      metaMask({
        dappMetadata: {
          name: 'My DApp',
          url: 'http://localhost:3000',
        },
        // 关键：禁用分析
        enableAnalytics: false,
      }),
      injected(),
    ],
    transports: {
      // 使用公共RPC - 立即就能用！
      [mainnet.id]: fallback([
        http('https://eth.llamarpc.com'),
        http('https://rpc.ankr.com/eth'),
        http('https://1rpc.io/eth'),
        http('https://cloudflare-eth.com'),
      ]),

      [sepolia.id]: fallback([
        http('https://rpc2.sepolia.org'),
        http('https://sepolia.drpc.org'),
        http('https://ethereum-sepolia-rpc.publicnode.com'),
      ]),
      [polygon.id]: http('https://polygon-rpc.com'),
    },
  });
}