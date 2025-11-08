// components/Web3Provider.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // 确保这是命名导入
import { WagmiProvider } from "wagmi";
import { config } from "../lib/wagmi";

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {" "}
        {/* 这里使用组件 */}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
