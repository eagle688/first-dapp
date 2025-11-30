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

// 移除所有异步和延迟，使用同步数据
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
];

// 同步函数，移除异步
export function getBlogPosts(): BlogPost[] {
  return mockBlogPosts;
}

export function getBlogPost(slug: string): BlogPost | null {
  return mockBlogPosts.find((post) => post.slug === slug) || null;
}

export function getPopularPosts(): BlogPost[] {
  return mockBlogPosts.slice(0, 3);
}
