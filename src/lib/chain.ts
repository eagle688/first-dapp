// lib/chains.ts
import { mainnet, sepolia, polygon, bsc, arbitrum } from "wagmi/chains";

export const SUPPORTED_CHAINS = [
  mainnet,
  sepolia,
  polygon,
  bsc,
  arbitrum,
] as const;

export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: "Ethereum",
  [sepolia.id]: "Sepolia",
  [polygon.id]: "Polygon",
  [bsc.id]: "BSC",
  [arbitrum.id]: "Arbitrum",
};

export const CHAIN_ICONS: Record<number, string> = {
  [mainnet.id]: "🦄",
  [sepolia.id]: "🧪",
  [polygon.id]: "🔺",
  [bsc.id]: "💵",
  [arbitrum.id]: "⚡",
};
