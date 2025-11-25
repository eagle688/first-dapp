// lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

/**
 * 创建 React Query 客户端配置
 * 配置缓存策略、重试逻辑等
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 数据在多久后视为过时（毫秒）
        staleTime: 30 * 1000, // 30秒
        // 缓存保留时间（毫秒）
        gcTime: 5 * 60 * 1000, // 5分钟
        // 重试次数
        retry: 1,
        // 窗口重新聚焦时重新获取数据
        refetchOnWindowFocus: false,
        // 网络重新连接时重新获取数据
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

// 导出一个默认的查询客户端实例
export const queryClient = createQueryClient();
