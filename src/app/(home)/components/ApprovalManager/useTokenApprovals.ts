// hooks/useTokenApprovals.ts
import { useReadContracts, useWriteContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { useMemo } from 'react';

export interface Approval {
  tokenAddress: `0x${string}`;
  spender: `0x${string}`;
  amount: bigint;
  symbol: string;
  spenderName: string;
}

export const useTokenApprovals = (address: `0x${string}` | undefined) => {
  // 常见DeFi协议地址
  const COMMON_SPENDERS = [
    { 
      address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', 
      name: 'Uniswap V3' 
    },
    { 
      address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', 
      name: 'Uniswap V3 Router' 
    },
    { 
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', 
      name: 'Uniswap V2' 
    },
  ] as const;

  // 常见代币列表
  const COMMON_TOKENS = [
    { 
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 
      symbol: 'USDC' 
    },
    // 可以添加更多代币
  ] as const;

  // 构建批量查询合约调用
  const contractCalls = useMemo(() => {
    if (!address) return [];

    const calls = [];
    
    for (const token of COMMON_TOKENS) {
      for (const spender of COMMON_SPENDERS) {
        calls.push({
          address: token.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'allowance' as const,
          args: [address, spender.address as `0x${string}`],
        });
      }
    }
    
    return calls;
  }, [address]);

  // 批量查询授权信息 - 这是正确的Hook使用方式
  const { data: allowancesData, isLoading } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: contractCalls.length > 0,
    }
  });

  // 处理查询结果，构建授权列表
  const approvals = useMemo(() => {
    if (!allowancesData) return [];

    const results: Approval[] = [];
    let callIndex = 0;

    for (const token of COMMON_TOKENS) {
      for (const spender of COMMON_SPENDERS) {
        const allowance = allowancesData[callIndex]?.result as bigint | undefined;
        
        if (allowance && allowance > 0n) {
          results.push({
            tokenAddress: token.address as `0x${string}`,
            spender: spender.address as `0x${string}`,
            amount: allowance,
            symbol: token.symbol,
            spenderName: spender.name
          });
        }
        callIndex++;
      }
    }

    return results;
  }, [allowancesData]);

  // 撤销授权
  const { writeContract: revokeApproval, isPending: isRevoking } = useWriteContract();

  const revoke = (tokenAddress: `0x${string}`, spender: `0x${string}`) => {
    return revokeApproval({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, 0n]
    });
  };

  return {
    approvals,
    revokeApproval: revoke,
    isLoading,
    isRevoking
  };
};