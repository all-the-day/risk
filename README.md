# 日课

打卡小组 App。用户加入一个「家」（团体），每天对 CL 事项逐项打勾；系统按周汇总出每个人的周分，成员可以查看本家周表，管理员可以录入或覆盖某人的周分。

## 核心概念

- **CL**：本项目的每日打卡内容。每项带分值（如 晨兴 6 分/周、擘饼 7 分/周），叶子项分值合计 = 模板满分（当前 51）
- **打勾式打卡**：只记「谁、哪天、做了哪项」，不用自己填分
- **周**：周日 → 周六；周键用该周周日的日期。未来周不可选
- **周分的两个来源**：① 成员每日打卡自动汇总 ② 管理员录入本周总分（**管理员优先**，录入即锁定，可「恢复自动」）
- **父项只作分组**：如「聚会」下挂 擘饼 / 主日，父项本身不打卡、不计分

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
npm run db:seed        # 管理员账号 + 周评模板（必需）
npm run db:seed:demo   # 可选：演示数据（一个家 + 5 位成员 + 最近 3 周记录）
npm run dev
```

访问 http://localhost:3000

**登录用昵称，不要用手机号**（手机号格式的输入会被拒绝）。管理员账号 `admin` / `admin123`；演示成员 `潘SY` / `123456`（演示成员昵称：潘SY、徐L、X娟、YS晨、林YX，密码都是 `123456`）。

## 项目结构

```
app/            # 页面和 API 路由
components/     # 组件（ui/ 为 shadcn 风格基础组件）
db/             # 数据访问层
services/       # 业务逻辑层
lib/            # 工具函数（auth / date / score / prisma）
prisma/         # 数据库 schema 与种子数据
test/           # Playwright 冒烟测试
```

## 文档

| 文档 | 说明 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 项目详细说明 |
| [MVP_PLAN.md](./doc/MVP_PLAN.md) | MVP 产品规划 |
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
npm run db:seed      # 初始化管理员与周评模板
npm run db:seed:demo # 初始化演示数据
```

## 测试

```bash
npm run db:seed:demo
node test/browser-test.mjs   # 登录 → 打卡 → 报告页 → 后台录入（需 dev server 在 3000）
```
