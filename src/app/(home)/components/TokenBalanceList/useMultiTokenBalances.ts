import { useState, useEffect, useCallback } from "react";
import { useAccount, useBalance, usePublicClient, useChainId } from "wagmi";
import { isAddress, formatUnits } from "viem";

// ERC20 函数签名（固定不变，直接硬编码，避免 ABI 解析问题）
const ERC20_SIGNATURES = {
  balanceOf: "0x70a08231", // 函数签名：balanceOf(address)
  name: "0x06fdde03", // 函数签名：name()
  symbol: "0x95d89b41", // 函数签名：symbol()
  decimals: "0x313ce567", // 函数签名：decimals()
};

export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  balance?: bigint;
  balanceFormatted?: string;
  isCustom?: boolean;
}

export function useMultiTokenBalances() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // 原生币余额查询（不变）
  const { data: nativeBalance } = useBalance({
    address,
    chainId,
    query: { enabled: !!address && !!chainId },
  });

  // 1. 获取默认代币列表（不变）
  const getDefaultTokens = useCallback(
    (currentChainId?: number): TokenInfo[] => {
      const baseTokens: TokenInfo[] = [];

      if (nativeBalance) {
        baseTokens.push({
          address:
            "0x0000000000000000000000000000000000000000" as `0x${string}`,
          name: nativeBalance.symbol,
          symbol: nativeBalance.symbol,
          decimals: nativeBalance.decimals,
          balance: nativeBalance.value,
          balanceFormatted: nativeBalance.formatted,
        });
      }

      // 预设代币（确保地址正确）
      if (currentChainId === 1) {
        // 以太坊主网
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
        // Polygon 主网
        baseTokens.push(
          {
            address:
              "0xc2132D05D31c914a87C6611C10748AEb04B58e8" as `0x${string}`,
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
    [nativeBalance]
  );

  // 2. 核心：纯 JSON-RPC 调用 ERC20 方法（无依赖）
  const fetchTokenBalances = useCallback(
    async (tokenList: TokenInfo[]) => {
      if (!address || !publicClient || !chainId) {
        console.warn("Missing address/publicClient/chainId");
        return tokenList;
      }

      setLoading(true);

      try {
        const updatedTokens = await Promise.all(
          tokenList.map(async (token) => {
            try {
              // 原生币跳过
              if (
                token.address === "0x0000000000000000000000000000000000000000"
              ) {
                return token;
              }

              // 地址校验
              if (!isAddress(token.address)) {
                console.error(`Invalid token address: ${token.address}`);
                return { ...token, balance: 0n, balanceFormatted: "0" };
              }

              // --------------------------
              // 关键：手动构造 JSON-RPC 请求
              // --------------------------
              // 1. 查询 balanceOf（地址参数需转 64 位十六进制）
              const balanceHex = await publicClient
                .request({
                  method: "eth_call",
                  params: [
                    {
                      to: token.address, // 代币合约地址
                      // data = 函数签名 + 地址参数（去掉 0x 后补 64 位）
                      data: `${ERC20_SIGNATURES.balanceOf}${address
                        .slice(2)
                        .padStart(64, "0")}`,
                    },
                    "latest", // 最新区块
                  ],
                })
                .catch(() => "0x0");

              const balance = BigInt(balanceHex as string);

              // 2. 查询 name（无参数，仅函数签名）
              const nameHex = await publicClient
                .request({
                  method: "eth_call",
                  params: [
                    { to: token.address, data: ERC20_SIGNATURES.name },
                    "latest",
                  ],
                })
                .catch(() => "0x");

              // 解码 name（ERC20 string 格式：前 32 字节是长度，后是内容）
              const name =
                nameHex !== "0x"
                  ? Buffer.from((nameHex as string).slice(130), "hex")
                      .toString("utf8")
                      .trim()
                  : "Unknown Token";

              // 3. 查询 symbol（无参数）
              const symbolHex = await publicClient
                .request({
                  method: "eth_call",
                  params: [
                    { to: token.address, data: ERC20_SIGNATURES.symbol },
                    "latest",
                  ],
                })
                .catch(() => "0x");

              const symbol =
                symbolHex !== "0x"
                  ? Buffer.from((symbolHex as string).slice(130), "hex")
                      .toString("utf8")
                      .trim()
                  : "UNKNOWN";

              // 4. 查询 decimals（无参数）
              const decimalsHex = await publicClient
                .request({
                  method: "eth_call",
                  params: [
                    { to: token.address, data: ERC20_SIGNATURES.decimals },
                    "latest",
                  ],
                })
                .catch(() => "0x12"); // 默认 18（0x12 是 18 的十六进制）

              const decimals = parseInt(decimalsHex as string, 16) || 18;

              // 格式化余额
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
          })
        );

        setTokens(updatedTokens);
        return updatedTokens;
      } catch (error) {
        console.error("Fetch balances failed:", error);
        return tokenList;
      } finally {
        setLoading(false);
      }
    },
    [address, publicClient, chainId, setLoading, setTokens]
  );

  // 3. 添加自定义代币（不变，复用上面的逻辑）
  const addCustomToken = async (tokenAddress: string) => {
    if (!isAddress(tokenAddress)) throw new Error("Invalid address");
    if (!publicClient || !chainId) throw new Error("PublicClient not ready");
    if (
      tokens.some((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
    ) {
      throw new Error("Token already exists");
    }

    try {
      // 手动查询代币信息
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

      await fetchTokenBalances([...tokens, newToken]);
      return newToken;
    } catch (error) {
      console.error("Add custom token failed:", error);
      throw new Error("Invalid ERC20 contract");
    }
  };

  // 4. 初始化和链切换时刷新
  useEffect(() => {
    if (address && chainId && publicClient) {
      const defaultTokens = getDefaultTokens(chainId);
      fetchTokenBalances(defaultTokens);
    }
  }, [
    address,
    chainId,
    publicClient,
    nativeBalance,
    getDefaultTokens,
    fetchTokenBalances,
  ]);

  return {
    tokens,
    loading,
    addCustomToken,
    refreshBalances: () => fetchTokenBalances(tokens),
  };
}
