# 日课

打卡小组 App。用户加入一个「家」（团体），每天对「项目」逐项打勾；系统按周汇总出每个人的周分，成员可以查看本家周表，管理员可以录入或覆盖某人的周分。

## 核心概念

- **项目（`ActivityItem`）是唯一实体**：没有模板、没有分类、没有父子层级。规则全部挂在项目上：
  分值 `score`、每周次数 `checksPerWeek`（达到即满分，超出不再加分但打卡照记）、打卡日 `allowedWeekdays`（不限 / 仅主日）、类型 `scope`（个人 / 团体）、顺序 `order`、启用 `enabled`
- **满分 = 启用项目分值之和**（`maxScoreOf()` 实时计算，不落库；当前 50）
- **打勾式打卡**：只记「谁、哪天、做了哪项」，不用自己填分
- **周**：周日 → 周六；周键用该周周日的日期。未来周不可选
- **周分的两个来源**：① 成员每日打卡自动汇总 ② 管理员录入本周总分（**管理员优先**，录入即锁定，可「恢复自动」）
- **删除是软删除**：项目被删除后不再出现、不计满分，历史打卡记录保留，可在后台「已删除」里恢复

## 技术栈

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui（base-ui 版，`components/ui/*`）
- Prisma 6 + SQLite
- jose (JWT) + bcryptjs

## 快速开始

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed        # 管理员账号 + 9 个默认项目（必需）
npm run db:seed:demo   # 可选：演示数据（一个家 + 5 位成员 + 最近 3 周记录）
npm run dev
```

访问 http://localhost:3000

**登录用昵称，不要用手机号**（手机号格式的输入会被拒绝）。管理员账号 `admin` / `admin123`；演示成员 `潘SY` / `123456`（演示成员昵称：潘SY、徐L、X娟、YS晨、林YX，密码都是 `123456`）。

## 项目结构

```
app/            # 页面和 API 路由（前台 /today /report /group /profile，后台 /admin/*）
components/     # 组件（ui/ 为 shadcn 组件）
db/             # 数据访问层
services/       # 业务逻辑层（打卡、周表聚合、团体）
lib/            # 工具函数（auth / date / score / nickname / prisma）
prisma/         # 数据库 schema 与种子数据
test/           # Playwright 冒烟测试
```

## 文档

| 文档 | 说明 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 项目详细说明（领域模型、接口、约定，改代码前先读） |

## 命令

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run lint         # 代码检查
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 同步数据库结构
npm run db:seed      # 初始化管理员与默认项目
npm run db:seed:demo # 初始化演示数据
```

## 测试

```bash
npm run db:seed:demo
node test/browser-test.mjs   # 登录 → 打卡 → 周表 → 后台录入 → 项目管理（需 dev server 在 3000，可用 BASE_URL 指定端口）
```
