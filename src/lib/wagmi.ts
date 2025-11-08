// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains' // 1. 导入您要连接的链
import { injected, metaMask } from 'wagmi/connectors' // 2. 导入钱包连接器

// 3. 创建并导出配置
export const config = createConfig({
  chains: [mainnet, sepolia], // 告诉Wagmi需要连接哪些区块链网络
  connectors: [
    injected(), // 支持内置钱包的浏览器（如MetaMask）
    metaMask(), // 明确支持MetaMask
  ],
  transports: {
    // 为每条链配置RPC传输方式
    [mainnet.id]: http(), // 使用默认的公共RPC节点
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'), // 测试网RPC
  },
})



