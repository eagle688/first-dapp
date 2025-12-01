// src/lib/queryConfig.ts
/**
 * 公共查询缓存配置 - 适用于代币余额类查询（ETH/ERC20）
 * 核心思路：平衡 Web3 场景的「实时性」和「性能」
 */
export const TOKEN_BALANCE_QUERY_CONFIG = {
  staleTime: 45 * 1000, // 45秒新鲜期：避免频繁 RPC 请求
  gcTime: 10 * 60 * 1000, // 10分钟缓存保留期：短时间切换页面无需重新请求
  refetchOnWindowFocus: true, // 窗口聚焦刷新：适配用户切回 DApp 需最新余额的场景
  refetchOnMount: false, // 组件挂载不自动刷新（依赖 staleTime 和窗口聚焦）
  refetchOnReconnect: false, // 网络重连不自动刷新（避免干扰用户操作）
};

// 可扩展其他公共配置（如 NFT 查询、交易历史查询）
// export const NFT_QUERY_CONFIG = { ... };
