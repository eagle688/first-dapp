import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useChainId } from "wagmi";
import { formatUnits } from "viem";
import {
  TokenInfo,
  getDefaultTokensByChainId,
  fetchErc20BalanceWithMeta,
} from "@/lib/erc20";
import { useCustomTokens } from "@/hooks/useCustomTokens";
import { useConnection } from "wagmi";
import { TOKEN_BALANCE_QUERY_CONFIG } from "@/lib/queryConfig"; // 导入公共配置

/**
 * 缓存版多代币余额查询 Hook（React Query 缓存优化）
 * @returns 代币列表 + 加载状态 + 刷新方法 + 添加自定义代币方法
 */
export function useCachedMultiTokenBalances() {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const { customTokens, addCustomToken } = useCustomTokens(); // 复用公共 Hook

  // 获取默认代币列表（根据链ID）
  const defaultTokens = getDefaultTokensByChainId(chainId);

  // 合并默认代币 + 自定义代币（去重）
  const allTokens = [...defaultTokens, ...customTokens].filter(
    (token, index, self) =>
      self.findIndex((t) => t.address === token.address) === index
  );

  // React Query 缓存查询所有代币余额
  const {
    data: tokens = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["multi-token-balances", chainId, address], // 缓存键（链ID+地址确保唯一性）
    queryFn: async () => {
      if (!publicClient || !address) throw new Error("未连接钱包或网络异常");

      // 批量查询所有代币余额（与非缓存版逻辑一致，复用公共工具）
      return Promise.all(
        allTokens.map(async (token) => {
          // 原生币（ETH）单独处理
          if (token.address === "0x0000000000000000000000000000000000000000") {
            const rawBalance = await publicClient.getBalance({ address });
            return {
              ...token,
              rawBalance,
              balance: formatUnits(rawBalance, token.decimals),
            };
          }
          // ERC20 代币（复用公共工具函数）
          return fetchErc20BalanceWithMeta(
            publicClient,
            address,
            token.address
          );
        })
      );
    },
    enabled: isConnected && !!address, // 仅连接钱包后触发查询
    ...TOKEN_BALANCE_QUERY_CONFIG, // 复用公共缓存配置
  });

  // 手动刷新余额（同时失效缓存）
  const refreshMultiTokenBalances = () => {
    queryClient.invalidateQueries({
      queryKey: ["multi-token-balances", chainId, address],
    });
    return refetch();
  };

  return {
    tokens,
    isLoading,
    error: error ? (error as Error).message : null,
    refreshMultiTokenBalances,
    addCustomToken,
  };
}
