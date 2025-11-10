 
import { createConfig, fallback, http } from 'wagmi'
import { sepolia,   polygon } from 'wagmi/chains'
import { metaMask, injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [ sepolia, polygon],
  connectors: [metaMask(), injected()],
  transports: {
    [sepolia.id]: fallback([
      http('https://rpc2.sepolia.org'),
      http('https://sepolia.drpc.org'),
      http('https://ethereum-sepolia-rpc.publicnode.com')

    ]),
    [polygon.id]: http(),
  },
})
