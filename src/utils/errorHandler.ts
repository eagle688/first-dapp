// utils/errorHandler.ts
import {
  BaseError,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
} from "viem";

/**
 * 将原始错误转换为用户友好的提示信息
 */
export function parseWalletError(error: unknown): {
  title: string;
  message: string;
  severity: "error" | "warning" | "info";
} {
  // 默认错误
  const defaultError = {
    title: "交易失败",
    message: "请重试或检查网络状态",
    severity: "error" as const,
  };

  if (!error) return defaultError;

  console.error("Original error:", error);

  // 1. viem ActionRejectedError - 用户在钱包端拒绝交易
  if (typeof error === "object" && "code" in error && error.code === 4001) {
    return {
      title: "交易已取消",
      message: "您在钱包中拒绝了此次交易",
      severity: "warning",
    };
  }

  // 2. viem BaseError 及其子类
  if (error instanceof BaseError) {
    // 余额不足
    if (
      error.message.includes("insufficient funds") ||
      error.name === "InsufficientFundsError"
    ) {
      return {
        title: "余额不足",
        message: "请检查您的钱包余额是否足够支付交易金额和 Gas 费",
        severity: "error",
      };
    }

    // Gas 不足
    if (
      error.message.includes("gas") ||
      error.message.includes("execution reverted")
    ) {
      return {
        title: "Gas 设置异常",
        message: "Gas 不足或交易可能失败，请调整 Gas 设置或稍后重试",
        severity: "error",
      };
    }

    // 网络不匹配
    if (error.message.includes("chain") || error.message.includes("network")) {
      return {
        title: "网络不匹配",
        message: "请检查钱包是否连接到正确的网络",
        severity: "warning",
      };
    }

    // 合约执行失败（如授权不足、交易回滚）
    if (error instanceof ContractFunctionExecutionError) {
      const revertError = error.walk(
        (e) => e instanceof ContractFunctionRevertedError
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        return {
          title: "交易执行失败",
          message: `合约拒绝交易: ${
            revertError.data?.errorName || "条件不满足"
          }`,
          severity: "error",
        };
      }
    }
  }

  // 3. 用户未安装钱包
  if (
    error instanceof Error &&
    error.message.includes("connector") &&
    error.message.includes("not found")
  ) {
    return {
      title: "未检测到钱包",
      message: "请安装 MetaMask 或其他兼容的钱包应用",
      severity: "warning",
    };
  }

  // 4. 超时错误
  if (
    error instanceof Error &&
    (error.message.includes("timeout") || error.message.includes("Timeout"))
  ) {
    return {
      title: "网络超时",
      message: "请求超时，请检查网络连接后重试",
      severity: "error",
    };
  }

  // 5. 其他已知的常见错误
  if (error instanceof Error) {
    // 用户拒绝
    if (error.message.includes("User rejected")) {
      return {
        title: "交易已取消",
        message: "您在钱包中取消了交易",
        severity: "info",
      };
    }

    // 链未连接
    if (error.message.includes("Unsupported chain")) {
      return {
        title: "不支持的链",
        message: "请切换到支持的区块链网络",
        severity: "warning",
      };
    }
  }

  // 未知错误返回原始信息（截取前100字符避免过长）
  return {
    title: "未知错误",
    message:
      error instanceof Error ? error.message.substring(0, 100) : "请稍后重试",
    severity: "error",
  };
}
