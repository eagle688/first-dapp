// utils/balanceFormatter.ts
import { formatUnits } from "viem";

/**
 * 安全地格式化余额，兼容不同版本的返回结构
 */
export function formatBalance(
  balance:
    | { value: bigint; decimals: number; symbol?: string }
    | undefined
    | null,
  options: {
    showSymbol?: boolean;
    maximumFractionDigits?: number;
  } = {}
): string {
  if (!balance || balance.value === undefined || balance.value === null) {
    return "0";
  }

  try {
    const { value, decimals, symbol } = balance;
    const formatted = formatUnits(value, decimals);

    // 处理小数位数
    let finalValue = formatted;
    if (options.maximumFractionDigits !== undefined) {
      const num = parseFloat(formatted);
      finalValue = num.toLocaleString("en-US", {
        maximumFractionDigits: options.maximumFractionDigits,
        useGrouping: false,
      });
    }

    return options.showSymbol && symbol
      ? `${finalValue} ${symbol}`
      : finalValue;
  } catch (error) {
    console.error("格式化余额失败:", error);
    return "0";
  }
}

/**
 * 类型安全的余额对象接口
 */
export interface BalanceData {
  value: bigint;
  decimals: number;
  symbol: string;
  // formatted 可能是可选属性，取决于版本
  formatted?: string;
}
