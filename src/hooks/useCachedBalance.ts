// hooks/useCachedBalance.ts
import { useBalance, useConnection } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

/**
 * 带缓存的余额查询 Hook
 * 优化性能，减少不必要的 RPC 调用
 */
export function useCachedBalance(tokenAddress?: `0x${string}`) {
  const { address, isConnected } = useConnection();
  const queryClient = useQueryClient();

  const balanceQuery = useBalance({
    address,
    token: tokenAddress as `0x${string}` | undefined,
    query: {
      enabled: !!address && isConnected,
      // 缓存配置
      staleTime: 45 * 1000, // 45秒内不会重新请求
      gcTime: 10 * 60 * 1000, // 10分钟缓存
      // 只在数据过时且窗口聚焦时才重新请求
      refetchOnWindowFocus: true,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  });

  // 手动刷新余额的方法
  const refreshBalance = () => {
    console.log("手动刷新余额");
    return balanceQuery.refetch();
  };

  /**
   * 预取指定地址的代币余额并缓存，提升后续查询性能
   * 仅在钱包已连接且地址有效时执行
   * 常见使用场景：在用户切换页面、打开弹窗等操作前调用，提前加载可能需要的数据。
   */
  const prefetchBalance = async () => {
    if (!address || !isConnected) return;

    await queryClient.prefetchQuery({
      queryKey: ["balance", address, tokenAddress],
      queryFn: () => balanceQuery.refetch(),
    });
  };

  return {
    ...balanceQuery,
    refreshBalance,
    prefetchBalance,
  };
}
