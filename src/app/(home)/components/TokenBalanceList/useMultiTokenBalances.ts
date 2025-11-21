// hooks/useMultiTokenBalances.ts
import { useState, useEffect } from "react";
import { useAccount, useBalance, usePublicClient } from "wagmi";
import { isAddress, getContract, formatUnits } from "viem";

// ERC-20 标准 ABI（只需要余额查询相关函数）
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

// TokenInfo 接口（保持 balance 为 bigint | undefined）
export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  balance?: bigint; // 无 null 类型，避免与 undefined 冲突
  balanceFormatted?: string;
  isCustom?: boolean;
}

export function useMultiTokenBalances() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. 获取主网币余额（ETH/BNB等）
  const { data: nativeBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  // 2. 初始化常用代币列表（根据链ID）
  const getDefaultTokens = (chainId?: number): TokenInfo[] => {
    const baseTokens: TokenInfo[] = [];

    // 添加主网币
    if (nativeBalance) {
      baseTokens.push({
        address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        name: nativeBalance.name,
        symbol: nativeBalance.symbol,
        decimals: 18,
        balance: nativeBalance.value,
        balanceFormatted: nativeBalance.formatted,
      });
    }

    // 以太坊主网（chainId=1）正确地址
    if (chainId === 1) {
      baseTokens.push(
        {
          address: "0xdAC17F958D2ee523a220620699459Aa84174" as `0x${string}`,
          name: "Tether USD",
          symbol: "USDT",
          decimals: 6,
        },
        {
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB4" as `0x${string}`,
          name: "USD Coin",
          symbol: "USDC",
          decimals: 6,
        }
      );
    } else if (chainId === 137) {
      // Polygon（chainId=137）正确地址
      baseTokens.push(
        {
          address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8" as `0x${string}`,
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
  };

  // 3. 批量查询代币余额
  const fetchTokenBalances = async (tokenList: TokenInfo[]) => {
    if (!address || !publicClient) return tokenList;

    setLoading(true);

    try {
      const updatedTokens = await Promise.all(
        tokenList.map(async (token) => {
          try {
            // 如果是主网币，已经有余额信息
            if (
              token.address === "0x0000000000000000000000000000000000000000"
            ) {
              return token;
            }

            // 创建合约实例
            const contract = getContract({
              address: token.address,
              abi: ERC20_ABI,
              client: publicClient,
            });

            // 并行获取余额和代币信息
            const [balance, name, symbol, decimals] = await Promise.all([
              contract.read.balanceOf([address]),
              contract.read.name().catch(() => "Unknown Token"),
              contract.read.symbol().catch(() => "UNKNOWN"),
              contract.read.decimals().catch(() => 18),
            ]);

            const balanceFormatted = formatUnits(
              balance as bigint,
              decimals as number
            );

            return {
              ...token,
              name: name as string,
              symbol: symbol as string,
              decimals: decimals as number,
              balance: balance as bigint,
              balanceFormatted,
            };
          } catch (error) {
            // fetchTokenBalances 中错误处理时，赋值 0n（bigint 类型）
            console.error(`Error fetching token ${token.address}:`, error);
            return { ...token, balance: 0n, balanceFormatted: "0" }; // 正确：0n 是 bigint
          }
        })
      );

      setTokens(updatedTokens);
      return updatedTokens;
    } catch (error) {
      console.error("Error fetching token balances:", error);
      return tokenList;
    } finally {
      setLoading(false);
    }
  };

  // 4. 添加自定义代币
  const addCustomToken = async (tokenAddress: string) => {
    if (!isAddress(tokenAddress)) {
      throw new Error("Invalid token address");
    }

    if (!publicClient) {
      throw new Error("Public client not available");
    }

    // 检查是否已存在
    if (
      tokens.some(
        (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
      )
    ) {
      throw new Error("Token already exists");
    }

    try {
      const contract = getContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        client: publicClient,
      });

      // 获取代币基本信息
      const [name, symbol, decimals] = await Promise.all([
        contract.read.name(),
        contract.read.symbol(),
        contract.read.decimals(),
      ]);

      const newToken: TokenInfo = {
        address: tokenAddress as `0x${string}`,
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        isCustom: true,
      };

      // 添加到列表并获取余额
      const updatedTokens = await fetchTokenBalances([...tokens, newToken]);
      return updatedTokens;
    } catch (error) {
      console.error("Error adding custom token:", error);
      throw new Error("Failed to add token - invalid ERC20 contract");
    }
  };

  // 5. 初始化和更新余额
  useEffect(() => {
    if (address && chain && publicClient) {
      const defaultTokens = getDefaultTokens(chain.id);
      fetchTokenBalances(defaultTokens);
    }
  }, [address, chain, publicClient, nativeBalance]);

  return {
    tokens,
    loading,
    addCustomToken,
    refreshBalances: () => fetchTokenBalances(tokens),
  };
}
