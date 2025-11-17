// 临时测试组件
import { useState } from "react";
import { getTransfers } from "@/lib/alchemy";

export function TestAlchemy() {
  const [testResult, setTestResult] = useState<string>("");

  const testAPI = async () => {
    try {
      const result = await getTransfers(
        "0x123c3a13b453dd183246b3843c87b3e5578ffc02"
      );
      setTestResult(`成功获取 ${result.transfers.length} 条交易记录`);
      console.log("Alchemy API 返回:", result);
    } catch (error: any) {
      setTestResult(`失败: ${error.message}`);
    }
  };

  return (
    <div className="p-4 bg-blue-500/10 rounded-lg">
      <button onClick={testAPI} className="px-4 py-2 bg-blue-500 rounded">
        测试Alchemy API
      </button>
      {testResult && <p className="mt-2 text-sm">{testResult}</p>}
    </div>
  );
}
