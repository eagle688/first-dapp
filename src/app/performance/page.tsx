// app/performance/page.tsx
export default function PerformancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">性能优化成果</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* SSR优化成果 */}
        <div className="border border-green-200 rounded-lg p-6 bg-green-50">
          <h2 className="text-xl font-semibold mb-4 text-green-800">
            🚀 SSR优化成果
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>首屏加载时间:</span>
              <span className="font-semibold">2.5s → 0.8s</span>
            </div>
            <div className="flex justify-between">
              <span>Lighthouse性能分:</span>
              <span className="font-semibold">65 → 95</span>
            </div>
            <div className="flex justify-between">
              <span>SEO评分:</span>
              <span className="font-semibold">65 → 95</span>
            </div>
          </div>
        </div>

        {/* 技术特性 */}
        <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            ⚡ 技术特性
          </h2>
          <ul className="space-y-2">
            <li>✅ 混合渲染 (SSG + SSR)</li>
            <li>✅ 增量静态再生 (ISR)</li>
            <li>✅ 动态元数据生成</li>
            <li>✅ 代码自动分割</li>
            <li>✅ 图片优化</li>
          </ul>
        </div>
      </div>

      {/* 使用场景说明 */}
      <div className="mt-8 border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🎯 SSR在Web3中的价值</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">适合SSR的场景：</h3>
            <ul className="text-sm space-y-1 text-green-700">
              <li>• 技术博客和文档</li>
              <li>• 项目介绍页面</li>
              <li>• 营销落地页</li>
              <li>• 教育内容页面</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">保持CSR的场景：</h3>
            <ul className="text-sm space-y-1 text-blue-700">
              <li>• 钱包连接界面</li>
              <li>• 实时交易页面</li>
              <li>• 用户仪表板</li>
              <li>• 动态数据展示</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
