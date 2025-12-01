import { usePublicClient } from "wagmi";
import { isAddress, formatUnits, parseAbi } from "viem";

type PublicClient = ReturnType<typeof usePublicClient>;
// 定义公共类型（抽离到类型文件更优，这里简化）
export interface TokenInfo {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  balance?: string; // 余额（格式化后，如 "1.23 USDC"）
  rawBalance?: bigint; // 原始余额（未格式化，链上返回值）
}

// ERC20 核心 ABI（抽离公共接口）
const ERC20_ABI = parseAbi([
  "function balanceOf(address owner) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
]);

/**
 * 校验并格式化钱包/合约地址
 * @param address 原始地址
 * @returns 标准化地址（`0x${string}` 格式）或 null（无效地址）
 */
export function validateAndFormatAddress(
  address: string
): `0x${string}` | null {
  if (!address || !isAddress(address)) return null;
  return address.toLowerCase() as `0x${string}`;
}

/**
 * 查询单个 ERC20 代币的基础信息（名称、符号、小数位）
 * @param publicClient Wagmi PublicClient
 * @param tokenAddress 代币合约地址
 * @returns TokenInfo（不含余额）
 */
export async function fetchErc20MetaInfo(
  publicClient: PublicClient,
  tokenAddress: `0x${string}`
): Promise<Omit<TokenInfo, "balance" | "rawBalance">> {
  try {
    // 批量调用合约方法（减少 RPC 请求）
    const [name, symbol, decimals] = await Promise.all([
      publicClient?.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "name",
      }),
      publicClient?.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
      publicClient?.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

    return {
      address: tokenAddress,
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number,
    };
  } catch (error) {
    console.error("查询代币元信息失败:", error);
    throw new Error(`无效的 ERC20 代币地址: ${tokenAddress}`);
  }
}

/**
 * 查询单个 ERC20 代币的余额（含基础信息）
 * @param publicClient Wagmi PublicClient
 * @param walletAddress 钱包地址
 * @param tokenAddress 代币合约地址
 * @returns 完整 TokenInfo（含余额）
 */
export async function fetchErc20BalanceWithMeta(
  publicClient: PublicClient,
  walletAddress: `0x${string}`,
  tokenAddress: `0x${string}`
): Promise<TokenInfo> {
  const metaInfo = await fetchErc20MetaInfo(publicClient, tokenAddress);

  // 查询余额
  const rawBalance = await publicClient?.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [walletAddress],
  });

  return {
    ...metaInfo,
    rawBalance: rawBalance as bigint,
    balance: formatUnits(rawBalance as bigint, metaInfo.decimals),
  };
}

/**
 * 根据链ID获取默认代币列表（ETH + 主流 ERC20）
 * @param chainId 链ID（如 1-以太坊主网，11155111-Sepolia）
 * @returns 默认 TokenInfo 数组
 */
export function getDefaultTokensByChainId(chainId?: number): TokenInfo[] {
  // 不同链的默认代币配置（可扩展更多链）
  const defaultTokens: Record<number, TokenInfo[]> = {
    1: [
      {
        address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      },
      {
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb4" as `0x${string}`,
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
      },
      {
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec" as `0x${string}`,
        name: "Tether",
        symbol: "USDT",
        decimals: 6,
      },
    ],
    11155111: [
      {
        address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        name: "Ethereum Sepolia",
        symbol: "ETH",
        decimals: 18,
      },
      {
        address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C723" as `0x${string}`,
        name: "USDC",
        symbol: "USDC",
        decimals: 6,
      },
    ],
    // 可添加更多链的默认代币
  };

  return defaultTokens[chainId || 11155111] || defaultTokens[11155111];
}
