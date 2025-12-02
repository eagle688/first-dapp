// 创建这个调试组件来测试不同的查询参数
import { useState } from "react";

type DebugResult = {
  type: string;
  count: number;
  sample?: Record<string, unknown> | null;
};

type TransferParams = {
  fromBlock: string;
  toBlock: string;
  category: string[];
  withMetadata: boolean;
  maxCount: string;
  excludeZeroValue: boolean;
  fromAddress?: string;
  toAddress?: string;
};

export function AlchemyDebugger() {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // 修改 getTransfers 函数以支持不同的查询模式
  const getTransfersWithMode = async (
    address: string,
    mode: "sent" | "received" | "all"
  ) => {
    const params: TransferParams = {
      fromBlock: "0x0",
      toBlock: "latest",
      category: ["external", "internal", "erc20"],
      withMetadata: true,
      maxCount: "0x14",
      excludeZeroValue: false,
    };

    // 根据模式设置不同的地址过滤
    if (mode === "sent") {
      params.fromAddress = address; // 只查发送
    } else if (mode === "received") {
      params.toAddress = address; // 只查接收
    } else {
      params.fromAddress = address; // 查所有（发送和接收）
      params.toAddress = address;
    }

    const response = await fetch(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [params],
        }),
      }
    );

    const data = await response.json();
    return data.result;
  };

  const testQueries = async () => {
    setIsTesting(true);
    const testAddress = "0x123c3a13b453dd183246b3843c87b3e5578ffc02";
    const results = [];

    try {
      // 测试1：只查发送的交易
      console.log("测试1: 查询发送的交易...");
      const sentResult = await getTransfersWithMode(testAddress, "sent");
      results.push({
        type: "只查发送",
        count: sentResult?.transfers?.length || 0,
        sample: sentResult?.transfers?.[0],
      });

      // 测试2：只查接收的交易
      console.log("测试2: 查询接收的交易...");
      const receivedResult = await getTransfersWithMode(
        testAddress,
        "received"
      );
      results.push({
        type: "只查接收",
        count: receivedResult?.transfers?.length || 0,
        sample: receivedResult?.transfers?.[0],
      });

      // 测试3：查所有（发送+接收）
      console.log("测试3: 查询所有交易...");
      const allResult = await getTransfersWithMode(testAddress, "all");
      results.push({
        type: "发送+接收",
        count: allResult?.transfers?.length || 0,
        sample: allResult?.transfers?.[0],
      });

      setDebugResults(results);

      // 在控制台输出详细结果
      console.log("=== Alchemy API 调试结果 ===");
      results.forEach((result) => {
        console.log(`${result.type}: ${result.count} 条记录`);
        if (result.sample) {
          console.log("示例交易:", result.sample);
        }
      });
    } catch (error) {
      console.error("调试失败:", error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 bg-purple-500/10 rounded-lg mt-4 border border-purple-500/20">
      <h4 className="font-semibold text-purple-400 mb-2">
        🔍 Alchemy API 调试器
      </h4>
      <button
        onClick={testQueries}
        disabled={isTesting}
        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 rounded-lg text-sm transition-colors mb-3"
      >
        {isTesting ? "测试中..." : "测试不同查询模式"}
      </button>

      {debugResults.length > 0 && (
        <div className="space-y-2 text-sm">
          {debugResults.map((result, i) => (
            <div key={i} className="p-2 bg-black/20 rounded">
              <div className="font-medium">
                {result.type}:{" "}
                <span
                  className={
                    result.count > 0 ? "text-green-400" : "text-red-400"
                  }
                >
                  {result.count} 条记录
                </span>
              </div>
              {result.sample && (
                <div className="text-xs text-gray-400 mt-1">
                  示例:{" "}
                  {((result.sample as { hash?: string })?.hash ?? "").slice(
                    0,
                    10
                  )}
                  ... (
                  {(result.sample as { category?: string })?.category ?? ""})
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
