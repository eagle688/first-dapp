import type { NextConfig } from "next";

// next.config.js
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 关键：手动暴露环境变量给客户端
  env: {
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  },
};

module.exports = nextConfig;
