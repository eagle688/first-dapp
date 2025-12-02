// GasConfigPanel.tsx - 最终优化版
"use client";
import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { formatGwei, parseGwei } from "viem";

type GasTier = "slow" | "standard" | "fast";

interface GasConfig {
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit?: bigint;
}

interface GasConfigPanelProps {
  onConfigChange: (config: GasConfig) => void;
  defaultGasLimit?: bigint;
}

const calculateTierPrice = (
  tier: GasTier,
  baseFee?: bigint,
  priorityFee?: bigint
) => {
  if (!baseFee || !priorityFee) return null;

  const multipliers = {
    slow: { base: 90n, priority: 80n },
    standard: { base: 100n, priority: 100n },
    fast: { base: 120n, priority: 150n },
  } satisfies Record<GasTier, { base: bigint; priority: bigint }>;

  const mult = multipliers[tier];
  const adjustedBaseFee = (baseFee * mult.base) / 100n;
  const adjustedPriorityFee = (priorityFee * mult.priority) / 100n;

  return {
    maxFeePerGas: adjustedBaseFee + adjustedPriorityFee,
    maxPriorityFeePerGas: adjustedPriorityFee,
  };
};

export default function GasConfigPanel({
  onConfigChange,
  defaultGasLimit,
}: GasConfigPanelProps) {
  const publicClient = usePublicClient();
  const [gasData, setGasData] = useState<{
    baseFee?: bigint;
    priorityFee?: bigint;
  }>({});
  const [selectedTier, setSelectedTier] = useState<GasTier>("standard");
  const [customGasPrice, setCustomGasPrice] = useState("");
  const [customGasLimit, setCustomGasLimit] = useState(
    defaultGasLimit?.toString() || ""
  );

  const updateGasTier = useCallback(
    (tier: GasTier, baseFee?: bigint, priorityFee?: bigint) => {
      if (!baseFee || !priorityFee) return;

      const tierConfig = calculateTierPrice(tier, baseFee, priorityFee);
      if (!tierConfig) return;

      const gasLimit = customGasLimit
        ? BigInt(customGasLimit)
        : defaultGasLimit;

      onConfigChange({
        ...tierConfig,
        gasLimit,
      });

      setSelectedTier(tier);
      setCustomGasPrice("");
    },
    [customGasLimit, defaultGasLimit, onConfigChange]
  );

  // 抽离到 useEffect 外面，接收依赖参数（避免闭包陷阱）
  const fetchGasData = async (
    publicClient: ReturnType<typeof usePublicClient> | undefined,
    isMounted: boolean,
    setGasData: React.Dispatch<
      React.SetStateAction<{ baseFee?: bigint; priorityFee?: bigint }>
    >,
    updateGasTier: (
      tier: string,
      baseFee?: bigint,
      priorityFee?: bigint
    ) => void
  ) => {
    if (!publicClient || !isMounted) return;

    try {
      const [block, feeHistory] = await Promise.all([
        publicClient.getBlock(),
        publicClient.getFeeHistory({
          blockCount: 1,
          rewardPercentiles: [25, 50, 75],
        }),
      ]);

      const baseFee = block.baseFeePerGas ?? undefined;
      const priorityFee = feeHistory.reward?.[0]?.[1];

      if (!isMounted) return;
      setGasData({ baseFee, priorityFee });
      updateGasTier("standard", baseFee, priorityFee);
    } catch (error) {
      console.error("Failed to fetch gas data:", error);
    }
  };

  // 获取实时 Gas 数据（优化版：30 秒刷新 + 严格卸载清理）
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    // 直接调用抽离的函数，传递必要依赖
    if (publicClient) {
      fetchGasData(publicClient, isMounted, setGasData, updateGasTier);
      intervalId = setInterval(
        () => fetchGasData(publicClient, isMounted, setGasData, updateGasTier),
        30000
      );
    }

    return () => {
      isMounted = false;
      intervalId && clearInterval(intervalId);
    };
  }, [publicClient, setGasData, updateGasTier]); // 依赖明确，避免闭包陷阱

  // 处理自定义 Gas 价格（不变）
  const handleCustomGasPriceChange = (value: string) => {
    setCustomGasPrice(value);

    try {
      if (value) {
        const gasPrice = parseGwei(value);
        const gasLimit = customGasLimit
          ? BigInt(customGasLimit)
          : defaultGasLimit;

        onConfigChange({
          gasPrice,
          gasLimit,
        });
        setSelectedTier("standard");
      }
    } catch (error) {
      console.error("Invalid gas price:", error);
    }
  };

  // 处理自定义 Gas Limit（不变）
  const handleCustomGasLimitChange = (value: string) => {
    setCustomGasLimit(value);

    const gasLimit = value ? BigInt(value) : defaultGasLimit;
    const config: GasConfig = { gasLimit };

    const shouldUseCustomGasPrice = !!customGasPrice;
    const shouldUseTierPrice =
      !customGasPrice && gasData.baseFee && gasData.priorityFee;

    if (shouldUseCustomGasPrice) {
      try {
        config.gasPrice = parseGwei(customGasPrice);
      } catch (error) {
        console.error("Invalid gas price:", error);
      }
    } else if (shouldUseTierPrice) {
      const tierConfig = calculateTierPrice(
        selectedTier,
        gasData.baseFee,
        gasData.priorityFee
      );
      if (tierConfig) {
        Object.assign(config, tierConfig);
      }
    }

    onConfigChange(config);
  };

  // console.log(selectedTier, gasData.baseFee, gasData.priorityFee);

  return (
    <div className="mt-4 p-3 bg-black/20 rounded border border-white/10">
      <h4 className="text-sm font-medium mb-3">⚙️ Gas 设置</h4>

      <div className="flex gap-2 mb-3">
        {(["slow", "standard", "fast"] as const).map((tier) => {
          // 为每个档位单独计算价格
          const tierPrice = calculateTierPrice(
            tier,
            gasData.baseFee,
            gasData.priorityFee
          );

          return (
            <button
              key={tier}
              onClick={() =>
                updateGasTier(tier, gasData.baseFee, gasData.priorityFee)
              }
              className={`flex-1 py-1 px-2 text-xs rounded ${
                selectedTier === tier && !customGasPrice
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {tier === "slow" ? "慢" : tier === "standard" ? "标准" : "快"}
              {tierPrice && !customGasPrice && (
                <div className="text-xs opacity-75">
                  {formatGwei(tierPrice.maxFeePerGas!)} Gwei
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-400">
            自定义 Gas 价格 (Gwei)
          </label>
          <input
            type="text"
            placeholder="例如: 30"
            value={customGasPrice}
            onChange={(e) => {
              setCustomGasPrice(e.target.value);
              handleCustomGasPriceChange(e.target.value);
            }}
            className="w-full p-1 text-sm rounded bg-black/30 border border-white/20"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400">Gas Limit</label>
          <input
            type="text"
            placeholder={`默认: ${defaultGasLimit?.toString() || "21000"}`}
            value={customGasLimit}
            onChange={(e) => handleCustomGasLimitChange(e.target.value)}
            className="w-full p-1 text-sm rounded bg-black/30 border border-white/20"
          />
        </div>
      </div>

      {gasData.baseFee && (
        <div className="mt-2 text-xs text-gray-400">
          基础费用: {formatGwei(gasData.baseFee)} Gwei
        </div>
      )}
    </div>
  );
}
