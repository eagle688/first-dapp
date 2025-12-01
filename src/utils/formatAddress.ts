// src/lib/utils.ts
import { isAddress } from "viem"; // 若项目已引入viem，可直接使用其地址校验工具

/**
 * 格式化钱包地址（首尾显示，中间省略）
 * @param address 原始钱包地址
 * @returns 格式化后的地址（如 0x1234...5678）
 */
export function formatAddress(address: string): string {
  if (!isAddress(address)) return "Invalid Address"; // 补充地址合法性校验
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
