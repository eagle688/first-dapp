// useTransactions.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { getTransfers, type AlchemyTransfer } from '@/lib/alchemy';
import { Transaction } from './types';

export const useTransactions = (address: `0x${string}` | undefined, pageSize = 5) => {
  // Store all fetched transactions (not paginated, just accumulated)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Refs to track what we've already fetched
  const nextPageKeyRef = useRef<string | undefined>(undefined);
  const allFetchedRef = useRef<Transaction[]>([]);

  const normalizeTransaction = (transfer: AlchemyTransfer, currentAddress: string): Transaction => {
    const isReceive = transfer.to.toLowerCase() === currentAddress.toLowerCase();
    const timestamp = transfer.metadata?.blockTimestamp || new Date().toISOString();
    
    let tokenSymbol = 'ETH';
    let displayValue = '0';
    
    if (transfer.category === 'erc20') {
      tokenSymbol = 'USDC';
      displayValue = transfer.value ? (transfer.value / 1e6).toString() : '0';
    } else {
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

  // Fetch the next page from the API and accumulate
  const fetchNextPage = useCallback(async () => {
    if (!address) return;

    setIsLoadingMore(true);
    try {
      const res = await getTransfers(address as string, nextPageKeyRef.current, pageSize);
      const newTxs = (res?.transfers || []).map((t: AlchemyTransfer) =>
        normalizeTransaction(t, address as string)
      );

      // Accumulate to all fetched
      allFetchedRef.current = [...allFetchedRef.current, ...newTxs];
      setAllTransactions([...allFetchedRef.current]);

      // Update pageKey for next fetch
      nextPageKeyRef.current = res?.pageKey;
      setHasMore(!!res?.pageKey);
    } catch (error) {
      console.error('获取交易历史失败:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [address, pageSize]);

  // Load more: append next page to accumulated list
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage();
    }
  }, [hasMore, isLoadingMore, fetchNextPage]);

  // Go to page: show items for that page from all fetched (desktop pagination)
  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber < 1) return;
    setCurrentPage(pageNumber);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!address) return;
    
    setIsLoading(true);
    setAllTransactions([]);
    allFetchedRef.current = [];
    nextPageKeyRef.current = undefined;
    setCurrentPage(1);

    const fetchInitial = async () => {
      try {
        const res = await getTransfers(address as string, undefined, pageSize);
        const txs = (res?.transfers || []).map((t: AlchemyTransfer) =>
          normalizeTransaction(t, address as string)
        );
        allFetchedRef.current = txs;
        setAllTransactions(txs);
        nextPageKeyRef.current = res?.pageKey;
        setHasMore(!!res?.pageKey);
      } catch (error) {
        console.error('获取交易历史失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [address, pageSize]);

  // Compute which transactions to display based on current page
  const displayedTransactions = allTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Total pages available (only count existing transactions, not future pages)
  const totalPages = allTransactions.length > 0 ? Math.ceil(allTransactions.length / pageSize) : 1;

  return {
    transactions: displayedTransactions,
    allTransactions: allTransactions,
    isLoading,
    isLoadingMore,
    hasMore,
    currentPage,
    totalPages,
    refetch: () => {
      setIsLoading(true);
      setAllTransactions([]);
      allFetchedRef.current = [];
      nextPageKeyRef.current = undefined;
      setCurrentPage(1);
      const fetchInitial = async () => {
        try {
          const res = await getTransfers(address as string, undefined, pageSize);
          const txs = (res?.transfers || []).map((t: AlchemyTransfer) =>
            normalizeTransaction(t, address as string)
          );
          allFetchedRef.current = txs;
          setAllTransactions(txs);
          nextPageKeyRef.current = res?.pageKey;
          setHasMore(!!res?.pageKey);
        } catch (error) {
          console.error('获取交易历史失败:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitial();
    },
    loadMore,
    goToPage,
  };
};