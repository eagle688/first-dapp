// lib/blog-data.ts
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  tags: string[];
}

// 模拟数据库数据
const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "understanding-ssr-in-web3",
    title: "SSR在Web3应用中的实践指南",
    excerpt: "深入探讨如何在Web3项目中实现服务端渲染，提升用户体验和SEO效果。",
    content: `这是一篇关于SSR在Web3应用中实践的完整文章内容。

## 什么是SSR？
服务端渲染（Server-Side Rendering）是指在服务器端生成HTML页面，然后发送到客户端。

## 在Web3中的应用
在Web3项目中，SSR可以显著提升页面加载速度和SEO效果。

## 实现方案
使用Next.js可以轻松实现SSR和SSG的混合渲染方案。`,
    coverImage: "/images/ssr-web3.jpg",
    author: "0x742d35Cc6634C0532925a3b8D",
    publishedAt: "2024-01-15",
    tags: ["SSR", "Next.js", "Web3"],
  },
  {
    id: "2",
    slug: "nextjs-ssr-patterns",
    title: "Next.js SSR模式最佳实践",
    excerpt: "学习Next.js中SSR、SSG和ISR的各种使用场景和优化技巧。",
    content: `这是一篇关于Next.js SSR模式最佳实践的完整文章内容。

## SSR vs SSG
服务端渲染和静态生成各有适用场景。

## 性能优化
通过合理的缓存策略和代码分割提升性能。

## 实际案例
分享几个成功的Web3项目案例。`,
    coverImage: "/images/nextjs-patterns.jpg",
    author: "0x742d35Cc6634C0532925a3b8D",
    publishedAt: "2024-01-10",
    tags: ["Next.js", "SSR", "性能优化"],
  },
  {
    id: "3",
    slug: "web3-performance-optimization",
    title: "Web3应用性能优化实战",
    excerpt: "从链下缓存到CDN加速，全面优化Web3应用性能。",
    content: `这是一篇关于Web3应用性能优化的完整文章内容。

## 链下缓存策略
使用Redis缓存频繁访问的链上数据。

## CDN加速
静态资源通过CDN分发提升全球访问速度。

## 数据库优化
合理的索引设计和查询优化。`,
    coverImage: "/images/web3-performance.jpg",
    author: "0x742d35Cc6634C0532925a3b8D",
    publishedAt: "2024-01-08",
    tags: ["Web3", "性能优化", "缓存"],
  },
];

// 模拟网络延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 异步获取所有博客文章
export async function getBlogPosts(): Promise<BlogPost[]> {
  console.log("🔍 获取博客列表...");
  await delay(150); // 模拟网络请求延迟
  return [...mockBlogPosts]; // 返回副本避免污染
}

// 异步根据slug获取单篇文章
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  console.log(`🔍 获取文章详情: ${slug}`);
  await delay(100); // 模拟网络请求延迟

  const post = mockBlogPosts.find((post) => post.slug === slug);
  if (!post) {
    console.warn(`❌ 文章未找到: ${slug}`);
    return null;
  }

  console.log(`✅ 找到文章: ${post.title}`);
  return { ...post }; // 返回副本
}

// 异步获取热门文章
export async function getPopularPosts(): Promise<BlogPost[]> {
  console.log("🔥 获取热门文章...");
  await delay(120);
  return mockBlogPosts.slice(0, 2); // 返回前2篇作为热门
}

// 异步根据标签筛选文章
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  console.log(`🏷️ 根据标签筛选: ${tag}`);
  await delay(100);
  return mockBlogPosts.filter((post) => post.tags.includes(tag));
}
