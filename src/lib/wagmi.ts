 
import { createConfig, fallback, http } from 'wagmi'
import { sepolia,   polygon, mainnet } from 'wagmi/chains'
import { metaMask, injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, polygon],
  connectors: [    metaMask({
      dappMetadata: {
        name: 'My DApp',
        url: 'http://localhost:3000',
      },
      // 关键：禁用分析
      enableAnalytics: false,
    }), injected()],
  transports: {
    // 使用公共RPC - 立即就能用！
    [mainnet.id]: fallback([
      http('https://eth.llamarpc.com'),           // 通常很快
      http('https://rpc.ankr.com/eth'),          // Ankr的公共节点
      http('https://1rpc.io/eth'),               // 1RPC服务
      http('https://cloudflare-eth.com'),        // 备用
    ]),

    [sepolia.id]: fallback([
      http('https://rpc2.sepolia.org'),
      http('https://sepolia.drpc.org'),
      http('https://ethereum-sepolia-rpc.publicnode.com')
    ]),
    [polygon.id]: http('https://polygon-rpc.com'),
  },
})