# 日课

匿名协作式每日功课系统。用户加入团体，完成预设每日任务，查看全员是否完成。

## 技术栈

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma 6 + SQLite
- jose (JWT) + bcryptjs

## 快速开始

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
app/            # 页面和 API 路由
components/     # 组件
db/             # 数据访问层
services/       # 业务逻辑层
lib/            # 工具函数
prisma/         # 数据库 schema
```

## 文档

| 文档 | 说明 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 项目详细说明 |
| [MVP_PLAN.md](./doc/MVP_PLAN.md) | MVP 产品规划 |
| [DEPLOY.md](./doc/DEPLOY.md) | 部署方案 |
| [模块设计说明.md](./doc/模块设计说明.md) | 模块边界 |
| [LIST.md](./doc/LIST.md) | 功能跟踪 |
| [变更记录.md](./doc/变更记录.md) | 变更模板 |

## 命令

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run lint         # 代码检查
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 同步数据库结构
npm run db:seed      # 初始化任务数据
```
