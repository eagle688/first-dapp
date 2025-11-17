// components/Web3Provider.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // 确保这是命名导入
import { WagmiProvider } from "wagmi";
import { buildWagmiConfig } from "../lib/wagmi";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [clientConfig, setClientConfig] = useState<ReturnType<typeof buildWagmiConfig> | null>(null);

  useEffect(() => {
    // schedule config creation after paint to avoid sync setState warnings
    const t = setTimeout(() => setClientConfig(buildWagmiConfig()), 0);
    return () => clearTimeout(t);
  }, []);

  if (!clientConfig) return null;

  return (
    <WagmiProvider config={clientConfig}>
      <QueryClientProvider client={queryClient}>
        {/* 这里使用组件 */}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
