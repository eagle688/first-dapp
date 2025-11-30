// app/blog/page.tsx
import { getBlogPosts } from "@/lib/blog-data";
import Link from "next/link";

export default async function BlogPage() {
  // 使用异步数据获取
  const posts = await getBlogPosts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Web3技术博客</h1>
      <p className="text-xl text-gray-600 mb-12">
        探索区块链开发、SSR优化和Web3最佳实践
      </p>

      {/* 性能指标 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-2 text-blue-800">
          <span>⚡</span>
          <span className="text-sm">异步数据加载 | 服务端渲染</span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded mb-4 flex items-center justify-center">
              <span className="text-gray-500 text-sm">封面图片</span>
            </div>

            <h2 className="text-xl font-semibold mb-3 line-clamp-2">
              {post.title}
            </h2>

            <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
            >
              阅读全文
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
