 
// constants/tokens.ts
export const USDC:Record<number, `0x${string}`>  = {
  1: "0xA0b86973c56B1e8f19b4D7f7Dd7f6f235C9b4f8D",
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", 
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
} as const;


// 创建一个安全的获取函数


export const getUsdcAddress = (chainId?: number): `0x${string}` | undefined => {
  if (!chainId) return undefined; // 返回 undefined 而不是 null
  return USDC[chainId]; // 如果chainId不存在，这里会返回undefined
};