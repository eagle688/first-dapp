// global.d.ts
export {}

declare global {
  interface Window {
    okxwallet?: {
      request: <T = unknown[]>(args: { 
        method: string; 
        params?: unknown[] 
      }) => Promise<T>;
      isOKExWallet?: boolean;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
    
    ethereum?: {
      request: <T = unknown>(args: { 
        method: string; 
        params?: unknown[] 
      }) => Promise<T>;
      isMetaMask?: boolean;
      isOKExWallet?: boolean;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
      chainId?: string;
      selectedAddress?: string;
    };
  }
}