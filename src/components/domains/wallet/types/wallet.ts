// types/wallet.ts
export interface DetectedWallet {
  id: string;
  name: string;
  emoji: string;
  type:
    | "metamask"
    | "okx"
    | "coinbase"
    | "tokenpocket"
    | "trust"
    | "bitget"
    | "generic";
  provider?: unknown;
}

export interface WalletConnectProps {
  onConnectSuccess: () => void;
}
