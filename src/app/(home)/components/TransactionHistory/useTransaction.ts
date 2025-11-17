// useTransactions.ts
import { useState, useEffect, useCallback } from 'react';
import { getTransfers, type AlchemyTransfer } from '@/lib/alchemy';
import { Transaction, PaginationInfo } from './types';

export const useTransactions = (address: `0x${string}` | undefined) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({ hasMore: false });

// useTransactions.ts - 更新 normalizeTransaction 函数
const normalizeTransaction = (transfer: AlchemyTransfer, currentAddress: string): Transaction => {
  const isReceive = transfer.to.toLowerCase() === currentAddress.toLowerCase();
  const timestamp = transfer.metadata?.blockTimestamp || new Date().toISOString();
  
  // 确定代币符号和值
  let tokenSymbol = 'ETH';
  let displayValue = '0';
  
  if (transfer.category === 'erc20') {
    tokenSymbol = 'USDC'; // 或者从asset字段获取
    displayValue = transfer.value ? (transfer.value / 1e6).toString() : '0'; // USDC有6位小数
  } else {
    // ETH交易 - 从value字段转换
    displayValue = transfer.value ? (transfer.value / 1e18).toString() : '0';
  }

  return {
    hash: transfer.hash,
    from: transfer.from,
    to: transfer.to,
    value: displayValue,
    tokenSymbol: tokenSymbol,
    timestamp: timestamp,
    type: isReceive ? 'receive' : 'send',
    category: transfer.category,
    explorerUrl: `https://sepolia.etherscan.io/tx/${transfer.hash}`
  };
};

  const fetchTransactions = useCallback(async (isLoadMore = false) => {
    if (!address) return;

    const loadingState = isLoadMore ? setIsLoadingMore : setIsLoading;
    loadingState(true);

    try {
      const result = await getTransfers(address, isLoadMore ? pagination.pageKey : undefined);
      const newTransactions = result?.transfers.map((transfer: AlchemyTransfer) => 
        normalizeTransaction(transfer, address)
      ) || []

      if (isLoadMore) {
        setTransactions(prev => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }

      setPagination({
        pageKey: result?.pageKey,
        hasMore: !!result?.pageKey
      });
    } catch (error) {
      console.error('获取交易历史失败:', error);
    } finally {
      loadingState(false);
    }
  }, [address, pagination.pageKey]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isLoadingMore) {
      fetchTransactions(true);
    }
  }, [pagination.hasMore, isLoadingMore, fetchTransactions]);

  useEffect(() => {
    fetchTransactions(false);
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    isLoadingMore,
    hasMore: pagination.hasMore,
    refetch: () => fetchTransactions(false),
    loadMore
  };
};