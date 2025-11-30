// app/blog/[slug]/page.tsx - 添加ISR和性能优化
import { getBlogPost, getPopularPosts } from "@/lib/blog-data";
import Link from "next/link";

interface BlogPostProps {
  params: Promise<{
    slug: string;
  }>;
}

// 配置增量静态再生 - 每10分钟重新生成页面
export const revalidate = 600;

export async function generateStaticParams() {
  const popularPosts = getPopularPosts();
  return popularPosts.map((post) => ({
    slug: post.slug,
  }));
}

// 动态生成元数据 - SEO优化
export async function generateMetadata({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  return {
    title: `${post.title} | Web3技术博客`,
    description: post.excerpt,
    keywords: post.tags.join(", "),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600">文章未找到</h1>
        <Link href="/blog" className="text-blue-500 mt-4 inline-block">
          返回博客列表
        </Link>
      </div>
    );
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

        {/* 性能指标展示 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            🚀 SSR渲染
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            ⚡ 增量静态再生
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
            🔍 SEO优化
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

      {/* 标签区域 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
          >
            #{tag}
          </span>
        ))}
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
