/** @type {import('next').NextConfig} */
const nextConfig = {
  // 产物在 CI 里构建，服务器只接收 .next/standalone（含最小 node_modules 子集）
  output: "standalone",
  // Prisma 的 query engine 是平台二进制、不在 import 图里，需显式带进 standalone；
  // bcryptjs 在应用里被打进 chunk，但部署时的 seed 脚本（prisma/seed.cjs）要 require 它
  outputFileTracingIncludes: {
    "/**/*": ["node_modules/.prisma/client/**/*", "node_modules/bcryptjs/**/*"],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

module.exports = nextConfig;
