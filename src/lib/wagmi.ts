import { http, fallback, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [metaMask()],
  transports: {
    [sepolia.id]: fallback([
      http('https://rpc2.sepolia.org'),
      http('https://sepolia.drpc.org'),
      http('https://ethereum-sepolia-rpc.publicnode.com')
    ]),
  },
})