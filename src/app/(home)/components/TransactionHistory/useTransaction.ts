// useTransactions.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { getTransfers, type AlchemyTransfer } from '@/lib/alchemy';
import { Transaction, PaginationInfo } from './types';

export const useTransactions = (address: `0x${string}` | undefined, pageSize = 5) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({ hasMore: false });
  const pageCache = useRef<Map<number, Transaction[]>>(new Map());
  const nextPageKey = useRef<Map<number, string | undefined>>(new Map());
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  // Fetch a specific page (1-based). This will sequentially fetch previous pages if needed
  const fetchPage = useCallback(async (pageNumber = 1, append = false) => {
    if (!address) return;

    const loadingState = append ? setIsLoadingMore : setIsLoading;
    loadingState(true);

    try {
      // Determine pageKey by ensuring we have fetched previous pages' nextPageKey
      let pageKeyToUse: string | undefined = undefined;

      for (let i = 1; i < pageNumber; i++) {
        // if we already have the nextPageKey after page i, use it; else fetch page i to populate it
        if (!nextPageKey.current.has(i)) {
          const res = await getTransfers(address, pageKeyToUse, pageSize);
          const txs = (res?.transfers || []).map((t: AlchemyTransfer) => normalizeTransaction(t, address));
          pageCache.current.set(i, txs);
          nextPageKey.current.set(i, res?.pageKey);
          pageKeyToUse = res?.pageKey;
          if (!res?.pageKey) break;
        } else {
          pageKeyToUse = nextPageKey.current.get(i);
        }
      }

      // now fetch the requested page if not cached
      if (!pageCache.current.has(pageNumber)) {
        const res = await getTransfers(address, pageKeyToUse, pageSize);
        const txs = (res?.transfers || []).map((t: AlchemyTransfer) => normalizeTransaction(t, address));
        pageCache.current.set(pageNumber, txs);
        nextPageKey.current.set(pageNumber, res?.pageKey);
      }

      const pageTxs = pageCache.current.get(pageNumber) || [];

      if (append) {
        setTransactions(prev => [...prev, ...pageTxs]);
      } else {
        setTransactions(pageTxs);
        setCurrentPage(pageNumber);
      }

      setPagination({
        pageKey: nextPageKey.current.get(pageNumber),
        hasMore: !!nextPageKey.current.get(pageNumber),
      });
    } catch (error) {
      console.error('获取交易历史失败:', error);
    } finally {
      loadingState(false);
    }
  }, [address, pageSize]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isLoadingMore) {
      const nextPage = currentPage + 1;
      fetchPage(nextPage, true);
      setCurrentPage(nextPage);
    }
  }, [pagination.hasMore, isLoadingMore, fetchPage, currentPage]);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber < 1) return;
    fetchPage(pageNumber, false);
  }, [fetchPage]);

  useEffect(() => {
    // reset caches when address changes
    pageCache.current.clear();
    nextPageKey.current.clear();
    setCurrentPage(1);
    fetchPage(1, false);
  }, [fetchPage, address]);

  return {
    transactions,
    isLoading,
    isLoadingMore,
    hasMore: pagination.hasMore,
    currentPage,
    refetch: () => fetchPage(1, false),
    loadMore,
    goToPage,
    // expose cache size for UI page buttons
    fetchedPages: () => pageCache.current.size,
  };
};