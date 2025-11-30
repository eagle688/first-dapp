// app/blog/page.tsx
import { getBlogPosts } from "@/lib/blog-data";
import Link from "next/link";

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Web3技术博客</h1>

      {/* 调试信息 */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
        <h3 className="font-bold mb-2">可用文章Slug:</h3>
        <ul className="space-y-1">
          {posts.map((post) => (
            <li key={post.slug}>
              <code className="bg-gray-100 px-2 py-1 rounded">{post.slug}</code>
              <span className="ml-2">→ {post.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.id}
            className="border border-gray-200 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
            <p className="text-gray-600 mb-4">{post.excerpt}</p>
            <p className="text-sm text-gray-500 mb-2">
              Slug: <code>{post.slug}</code>
            </p>
            <Link
              href={`/blog/${post.slug}`}
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              阅读全文
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
