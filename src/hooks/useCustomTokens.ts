import { useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import {
  TokenInfo,
  validateAndFormatAddress,
  fetchErc20MetaInfo,
} from "../lib/erc20";

type WagmiV1PublicClient = ReturnType<typeof usePublicClient>;

/**
 * 自定义代币管理 Hook（抽离添加/管理自定义代币的重复逻辑）
 * @returns 自定义代币列表 + 添加方法
 */
export function useCustomTokens() {
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([]);

  /**
   * 添加自定义代币
   * @param publicClient Wagmi PublicClient
   * @param chainId 当前链ID
   * @param tokenAddress 代币合约地址
   * @param existingTokens 已存在的代币列表（默认+自定义，用于去重）
   * @returns 新增的代币信息（失败返回 null）
   */
  const addCustomToken = useCallback(
    async (
      publicClient: WagmiV1PublicClient,
      chainId: number,
      tokenAddress: string,
      existingTokens: TokenInfo[]
    ): Promise<TokenInfo | null> => {
      // 1. 校验地址
      const formattedAddr = validateAndFormatAddress(tokenAddress);
      if (!formattedAddr) {
        alert("无效的代币地址！");
        return null;
      }

      // 2. 去重检查（已存在则不添加）
      const isDuplicate = existingTokens.some(
        (token) => token.address.toLowerCase() === formattedAddr.toLowerCase()
      );
      if (isDuplicate) {
        alert("该代币已添加！");
        return null;
      }

      // 3. 查询代币元信息
      try {
        const metaInfo = await fetchErc20MetaInfo(publicClient, formattedAddr);
        const newToken: TokenInfo = { ...metaInfo };

        // 4. 更新自定义代币列表（去重后添加）
        setCustomTokens((prev) => {
          const filtered = prev.filter((t) => t.address !== formattedAddr);
          return [...filtered, newToken];
        });

        return newToken;
      } catch (error) {
        alert((error as Error).message);
        return null;
      }
    },
    []
  );

  return { customTokens, setCustomTokens, addCustomToken };
}
