// global.d.ts
export {};

// 定义EIP-1193标准Provider接口
interface EIP1193Provider {
  chainId?: string;
  selectedAddress?: string;
  request<T = unknown>(args: {
    method: string;
    params?: unknown[];
  }): Promise<T>;
  on(eventName: string, listener: (...args: unknown[]) => void): void;
  removeListener(
    eventName: string,
    listener: (...args: unknown[]) => void
  ): void;

  on(eventName: "chainChanged", listener: (chainId: string) => void): void;
  on(
    eventName: "accountsChanged",
    listener: (accounts: string[]) => void
  ): void;
  on(eventName: string, listener: (...args: unknown[]) => void): void; // 兼容其他事件
  providers?: EIP1193Provider[]; // 多钱包共存时的Provider列表
}

declare global {
  interface Window {
    okxwallet?: EIP1193Provider & { isOKExWallet: true };
    ethereum?: EIP1193Provider & {
      isMetaMask?: true;
      isOKExWallet?: true;
    };
    coinbaseWalletExtension?: EIP1193Provider & { isCoinbaseWallet: true };
    trustwallet?: EIP1193Provider & { isTrust: true };
    tokenpocket?: EIP1193Provider & { isTokenPocket: true };
  }
}
