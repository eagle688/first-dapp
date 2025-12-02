// 1. 直接写死密钥（和 Wagmi 配置中的密钥一致）
const ALCHEMY_API_KEY = "DJZ_lg5rybcWBbfx-ceV4";
// 2. 构建 BASE_URL（确保地址正确：eth-sepolia.g.alchemy.com，注意是 g.alchemy.com）
const BASE_URL = ALCHEMY_API_KEY
  ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  : undefined;

// 注释掉这个警告（因为已经写死密钥，不会触发）
// if (!ALCHEMY_API_KEY) {
//   console.error('[lib/alchemy] Missing NEXT_PUBLIC_ALCHEMY_API_KEY environment variable');
// }

export interface AlchemyTransfer {
  blockNum: string;
  hash: string;
  from: string;
  to: string;
  value?: number;
  asset: string;
  category: "external" | "internal" | "erc20" | "erc721";
  metadata?: {
    blockTimestamp: string;
  };
}

export interface AlchemyResponse {
  jsonrpc: string;
  id: number;
  result?: {
    transfers: AlchemyTransfer[];
    pageKey?: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

// lib/alchemy.ts - 更新 getTransfers 函数
export async function getTransfers(
  address: string,
  pageKey?: string,
  pageSize = 5
): Promise<AlchemyResponse["result"]> {
  try {
    // 分别查询发送和接收的交易
    const [sentTransfers, receivedTransfers] = await Promise.all([
      // 查询发送的交易
      fetchTransfersByMode(address, "sent", pageKey, pageSize),
      // 查询接收的交易
      fetchTransfersByMode(address, "received", pageKey, pageSize),
    ]);

    // 合并结果并按时间排序
    const allTransfers = [
      ...(sentTransfers?.transfers || []),
      ...(receivedTransfers?.transfers || []),
    ].sort((a, b) => {
      const timeA = parseInt(a.blockNum, 16);
      const timeB = parseInt(b.blockNum, 16);
      return timeB - timeA; // 按区块号降序排列（新的在前）
    });

    return {
      transfers: allTransfers,
      pageKey: sentTransfers?.pageKey || receivedTransfers?.pageKey,
    };
  } catch (error) {
    console.error("Alchemy API调用失败:", error);
    throw error;
  }
}

// 新增：按模式查询交易的辅助函数
async function fetchTransfersByMode(
  address: string,
  mode: "sent" | "received",
  pageKey?: string,
  pageSize = 5
) {
  const hexCount = "0x" + pageSize.toString(16);
  const params: Record<string, unknown> = {
    fromBlock: "0x0",
    toBlock: "latest",
    category: ["external", "internal", "erc20"],
    withMetadata: true,
    maxCount: hexCount, // 每模式按 pageSize
    excludeZeroValue: false,
    ...(pageKey && { pageKey: pageKey }),
  };

  // 根据模式设置地址过滤
  if (mode === "sent") {
    params.fromAddress = address;
  } else {
    params.toAddress = address;
  }

  if (!BASE_URL) {
    throw new Error("Alchemy base URL is not configured (missing API key)");
  }

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: mode === "sent" ? 1 : 2, // 不同的ID避免冲突
      method: "alchemy_getAssetTransfers",
      params: [params],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "<no body>");
    console.error(
      `[lib/alchemy] Alchemy network error (${mode}):`,
      response.status,
      response.statusText,
      text
    );
    return { transfers: [] };
  }

  const data: AlchemyResponse = await response.json();

  if (data.error) {
    console.error(`[lib/alchemy] Alchemy API ${mode} error:`, data.error);
    return { transfers: [] };
  }

  return data.result;
}
