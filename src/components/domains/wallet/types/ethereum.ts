// types/ethereum.ts
export interface EthereumProvider {
  isMetaMask?: boolean;
  isOKExWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isTokenPocket?: boolean;
  isTrust?: boolean;
  request?: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
  accounts?: string[];
  chainId?: string;
  providers?: EthereumProvider[];
}

export type WindowWithWallets = Window & {
  ethereum?: EthereumProvider;
  okxwallet?: Partial<EthereumProvider>;
  okexchain?: Partial<EthereumProvider>;
  coinbaseWalletExtension?: Partial<EthereumProvider>;
  tokenpocket?: Partial<EthereumProvider>;
  TokenPocket?: Partial<EthereumProvider>;
  trustwallet?: Partial<EthereumProvider>;
  bitkeep?: Partial<EthereumProvider>;
  _originalEthereum?: EthereumProvider;
};