// src/app/(home)/components/TransactionHistory/types.ts
 

export interface TransactionHistoryProps {
  address: `0x${string}` | undefined;
}

export interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

// types.ts
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  timestamp: string;
  type: 'send' | 'receive';
  category: string;
  explorerUrl: string;
}

export interface PaginationInfo {
  pageKey?: string;
  hasMore: boolean;
}