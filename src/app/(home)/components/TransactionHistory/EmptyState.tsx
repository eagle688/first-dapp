// components/TransactionHistory/EmptyState.tsx
export function EmptyState() {
  return (
    <div className="text-center py-8 text-gray-400" data-testid="empty-state">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-lg font-medium">暂无交易记录</p>
      <p className="text-sm mt-2 max-w-sm mx-auto">
        完成一笔ETH或USDC转账后，您的交易记录将显示在这里
      </p>
      <div className="mt-4 text-xs text-gray-500">
        <p>支持显示：ETH转账、USDC转账</p>
      </div>
    </div>
  );
}
