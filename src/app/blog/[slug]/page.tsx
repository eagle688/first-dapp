// app/blog/[slug]/page.tsx
import { getBlogPost, getPopularPosts } from "@/lib/blog-data";
import { notFound } from "next/navigation";
import Link from "next/link";

interface BlogPostProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 600; // ISR: 10分钟

export async function generateStaticParams() {
  const popularPosts = await getPopularPosts();
  return popularPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  return {
    title: `${post.title} | Web3技术博客`,
    description: post.excerpt,
    keywords: post.tags.join(", "),
  };
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 border-b pb-6">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <span>
            作者: {post.author.slice(0, 10)}...{post.author.slice(-8)}
          </span>
          <span>•</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("zh-CN")}
          </time>
        </div>

        {/* 异步加载标识 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            🚀 异步SSR渲染
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            ⏱️ 模拟网络延迟
          </span>
        </div>
      </header>

      <div className="prose max-w-none mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <p className="text-lg text-gray-700 font-medium">{post.excerpt}</p>
        </div>
        <div className="leading-relaxed text-gray-800">
          {post.content.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <footer className="border-t pt-6">
        <Link
          href="/blog"
          className="inline-flex items-center text-blue-500 hover:text-blue-700 font-medium"
        >
          ← 返回博客列表
        </Link>
      </footer>
    </article>
  );
}
