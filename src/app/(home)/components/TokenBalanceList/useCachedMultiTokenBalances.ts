// hooks/useCachedMultiTokenBalances.ts
import { useState, useCallback } from "react";
import { useConnection, usePublicClient, useChainId } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAddress, formatUnits } from "viem";
import { TokenInfo } from "./useMultiTokenBalances";

//   ERC20 签名
const ERC20_SIGNATURES: { [key: string]: `0x${string}` } = {
  balanceOf: "0x70a08231",
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
};

/**
 * 带缓存的多代币余额查询 Hook
 * 使用 React Query 管理缓存和状态
 */
export function useCachedMultiTokenBalances() {
  const { address } = useConnection();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([]);

  // 1. 获取默认代币列表（复用您现有的逻辑）
  const getDefaultTokens = useCallback(
    (currentChainId?: number): TokenInfo[] => {
      const baseTokens: TokenInfo[] = [];

      // 这里可以添加原生币，但我们会用单独的 useBalance
      if (currentChainId === 1) {
        baseTokens.push(
          {
            address:
              "0xdAC17F958D2ee523a2206206994597C13D831ec7" as `0x${string}`,
            name: "Tether USD",
            symbol: "USDT",
            decimals: 6,
          },
          {
            address:
              "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`,
            name: "USD Coin",
            symbol: "USDC",
            decimals: 6,
          }
        );
      } else if (currentChainId === 137) {
        baseTokens.push(
          {
            address:
              "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as `0x${string}`,
            name: "Tether USD",
            symbol: "USDT",
            decimals: 6,
          },
          {
            address:
              "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as `0x${string}`,
            name: "USD Coin",
            symbol: "USDC",
            decimals: 6,
          }
        );
      }

      return baseTokens;
    },
    []
  );

  // 2. 单个代币余额查询函数（带缓存）
  const fetchTokenBalance = async (token: TokenInfo): Promise<TokenInfo> => {
    if (!address || !publicClient) {
      throw new Error("Missing address or public client");
    }

    // 如果是自定义代币且已有余额信息，直接返回
    if (token.isCustom && token.balance !== undefined) {
      return token;
    }

    try {
      // 查询 balanceOf
      const balanceHex = await publicClient.request({
        method: "eth_call",
        params: [
          {
            to: token.address,
            data: `${ERC20_SIGNATURES.balanceOf}${address
              .slice(2)
              .padStart(64, "0")}`,
          },
          "latest",
        ],
      });

      const balance = BigInt(balanceHex as string);

      // 对于预设代币，使用已有信息；对于自定义代币，查询详细信息
      let name = token.name;
      let symbol = token.symbol;
      let decimals = token.decimals;

      if (token.isCustom || !token.name || token.name === "Unknown Token") {
        // 并行查询代币信息
        const [nameHex, symbolHex, decimalsHex] = await Promise.all([
          publicClient.request({
            method: "eth_call",
            params: [
              { to: token.address, data: ERC20_SIGNATURES.name },
              "latest",
            ],
          }),
          publicClient.request({
            method: "eth_call",
            params: [
              { to: token.address, data: ERC20_SIGNATURES.symbol },
              "latest",
            ],
          }),
          publicClient.request({
            method: "eth_call",
            params: [
              { to: token.address, data: ERC20_SIGNATURES.decimals },
              "latest",
            ],
          }),
        ]);

        name =
          nameHex !== "0x"
            ? Buffer.from((nameHex as string).slice(130), "hex")
                .toString("utf8")
                .trim()
            : "Unknown Token";

        symbol =
          symbolHex !== "0x"
            ? Buffer.from((symbolHex as string).slice(130), "hex")
                .toString("utf8")
                .trim()
            : "UNKNOWN";

        decimals =
          decimalsHex !== "0x" ? parseInt(decimalsHex as string, 16) : 18;
      }

      const balanceFormatted = formatUnits(balance, decimals);

      return {
        ...token,
        name,
        symbol,
        decimals,
        balance,
        balanceFormatted,
      };
    } catch (error) {
      console.error(`Fetch token ${token.address} failed:`, error);
      return { ...token, balance: 0n, balanceFormatted: "0" };
    }
  };

  // 3. 所有代币余额查询（使用 React Query 缓存）
  const {
    data: tokens = [],
    isLoading,
    isError,
    refetch: refreshBalances,
  } = useQuery({
    queryKey: ["multiTokenBalances", address, chainId, customTokens],
    queryFn: async () => {
      if (!address || !publicClient || !chainId) {
        return [];
      }

      const defaultTokens = getDefaultTokens(chainId);
      const allTokens = [...defaultTokens, ...customTokens];

      // 并行查询所有代币余额
      const tokenPromises = allTokens.map((token) => fetchTokenBalance(token));
      const results = await Promise.all(tokenPromises);

      return results;
    },
    enabled: !!address && !!publicClient && !!chainId,
    staleTime: 30 * 1000, // 30秒缓存
    gcTime: 5 * 60 * 1000, // 5分钟垃圾回收
    refetchOnWindowFocus: false,
  });

  // 4. 添加自定义代币
  const addCustomToken = async (tokenAddress: string) => {
    if (!isAddress(tokenAddress)) throw new Error("Invalid address");
    if (!publicClient || !chainId) throw new Error("PublicClient not ready");

    // 检查是否已存在
    if (
      tokens.some(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
      ) ||
      customTokens.some(
        (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
      )
    ) {
      throw new Error("Token already exists");
    }

    try {
      // 查询代币基本信息
      const [name, symbol, decimals] = await Promise.all([
        publicClient
          .request({
            method: "eth_call",
            params: [
              { to: tokenAddress, data: ERC20_SIGNATURES.name },
              "latest",
            ],
          })
          .then((hex: string) =>
            Buffer.from(hex.slice(130), "hex").toString("utf8").trim()
          ),
        publicClient
          .request({
            method: "eth_call",
            params: [
              { to: tokenAddress, data: ERC20_SIGNATURES.symbol },
              "latest",
            ],
          })
          .then((hex: string) =>
            Buffer.from(hex.slice(130), "hex").toString("utf8").trim()
          ),
        publicClient
          .request({
            method: "eth_call",
            params: [
              { to: tokenAddress, data: ERC20_SIGNATURES.decimals },
              "latest",
            ],
          })
          .then((hex: string) => parseInt(hex, 16) || 18),
      ]);

      const newToken: TokenInfo = {
        address: tokenAddress as `0x${string}`,
        name,
        symbol,
        decimals,
        isCustom: true,
      };

      // 添加到自定义代币列表
      setCustomTokens((prev) => [...prev, newToken]);

      return newToken;
    } catch (error) {
      console.error("Add custom token failed:", error);
      throw new Error("Invalid ERC20 contract");
    }
  };

  // 5. 手动刷新单个代币（优化性能）
  const refreshTokenBalance = async (tokenAddress: string) => {
    const token = tokens.find((t) => t.address === tokenAddress);
    if (!token) return;

    try {
      const updatedToken = await fetchTokenBalance(token);

      // 更新查询缓存
      queryClient.setQueryData(
        ["multiTokenBalances", address, chainId, customTokens],
        (old: TokenInfo[] | undefined) => {
          if (!old) return [updatedToken];
          return old.map((t) =>
            t.address === tokenAddress ? updatedToken : t
          );
        }
      );
    } catch (error) {
      console.error(`Refresh token ${tokenAddress} failed:`, error);
    }
  };

  return {
    tokens,
    loading: isLoading,
    isError,
    addCustomToken,
    refreshBalances,
    refreshTokenBalance,
    customTokensCount: customTokens.length,
  };
}
