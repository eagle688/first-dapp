// hooks/useSafeWalletConnect.ts
import { useConnect } from "wagmi";
import { createWalletConnectConnector } from "@/lib/walletConnectFix";

export function useSafeWalletConnect() {
  const { connect } = useConnect();

  const safeConnectWalletConnect = async (onSuccess: () => void) => {
    try {
      // 动态创建连接器，避免配置时的版本问题
      const connector = createWalletConnectConnector();
      await connect({ connector });
      onSuccess();
    } catch (error) {
      console.error('WalletConnect 连接错误:', error);
      
      let errorMessage = '连接失败';
      if (error instanceof Error) {
        if (error.message.includes('isNewChainsStale')) {
          errorMessage = 'WalletConnect 版本兼容性问题，请尝试更新依赖';
        } else if (error.message.includes('user rejected')) {
          errorMessage = '用户取消了连接';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(`WalletConnect 连接失败: ${errorMessage}`);
    }
  };

  return { safeConnectWalletConnect };
}