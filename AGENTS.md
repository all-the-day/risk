# AGENTS.md

## What this is

中文「日课」打卡小组 App。用户加入一个「家」（团体），每天对 CL 事项逐项打勾，系统按周汇总出每个人的周分，成员可查看本家周表，管理员可录入/覆盖周分。MVP 阶段。

**CL** = 本项目的每日打卡内容；事项带分值（如 CX 晨兴 6 分/周、聚会 → XP 擘饼 7 分/周），叶子项分值合计 = 模板满分（当前 51）。

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**（`@tailwindcss/postcss`，CSS 内 `@theme` 配置，**不要**建 `tailwind.config.js`）
- **shadcn/ui** 风格组件（`components/ui/*`，基于 `@base-ui/react`）
- **Prisma 6** + **SQLite**（`prisma/dev.db`）
- **jose**（JWT 会话）、**bcryptjs**（口令哈希）、**date-fns**（日期）
- 部署不在本仓库范围内。

## Commands

```bash
npm run dev          # 开发服务器（localhost:3000）
npm run build        # 生产构建
npm run lint         # ESLint
npm run db:generate  # prisma generate
npm run db:push      # 同步 schema 到数据库（无 migration 文件）
npm run db:seed      # 管理员账号 + 周评模板（生产必需）
npm run db:seed:demo # 演示数据：一个家 + 5 位成员 + 最近 3 周打卡记录（开发用）
```

改 schema 后：`db:generate` → `db:push` →（必要时）`db:seed`。
清库重来：删掉 `prisma/dev.db` 后依次 `db:push`、`db:seed`、`db:seed:demo`。注意 cookie 里的 userId 失效，**需要重新登录**。

冒烟测试（需要 dev server 在 3000 端口）：

```bash
npm run db:seed:demo        # 测试依赖演示数据
node test/browser-test.mjs  # 登录 → 打卡 → 报告页 → 后台录入，14 项
```

## Architecture

分层单包全栈应用（`@/*` 指向项目根）：

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| 页面与路由 | `app/` | 页面（Server Component 取数 + `XxxClient.tsx` 交互）+ Route Handler |
| 业务逻辑 | `services/` | `auth`（注册登录）、`activity`（打卡清单与切换）、`group`（今日完成情况）、`weekly-score`（周表聚合） |
| 数据访问 | `db/` | `activity`、`record`、`weekly-score`、`group` |
| 工具 | `lib/` | `auth`（会话 + 守卫）、`prisma`、`date`、`score`、`utils` |
| 组件 | `components/` | `ui/*`、`BottomNav`、`AdminSidebar`、`ItemCheckButton`、`WeekPicker` |

## Domain model（核心，改之前先读懂）

```
ActivityTemplate ─┬─ ActivityCategory
                  └─ ActivityItem（parentId 自关联，两层；categoryId 可选）
                              ↓ 每日打勾
                        ActivityRecord（userId + itemId + date）
                              ↓ 读取时实时汇总
                        周分（自动）  ←被覆盖→  WeeklyScore（管理员录入）
```

- **`ActivityItem` 是唯一事项源**。`enabled=false` 的事项不显示、不计分。
- **父项不参与打卡与计分**：有子项的事项只作分组标题（如「聚会」→ XP、ZR），它的 `score` 是子项之和，仅作展示。
- **每日打卡是打勾式**：`ActivityRecord` 只记「某人某天做了某项」，`@@unique([userId, itemId, date])`。
- **周分不在打卡时落库，读取时实时汇总**——避免"改了算法旧快照不一致"。`WeeklyScore` **行的存在即代表管理员覆盖**（无需 `locked` 字段），「恢复自动」= 删该行。

## Scoring rules（`lib/score.ts`）

- 单次得分 = `item.score / item.checksPerWeek`（`checksPerWeek <= 0` 按 1 兜底）
- 本周次数超过 `checksPerWeek` 封顶；不足按已完成次数线性给分
- 内部按「分 × 100」整数累加，展示时四舍五入为整数
- 周表分母一律取 `template.maxScore`（**不要**累加所有 `item.score`，会把父项算进去）

## Week rules（`lib/date.ts`）

- 一周 = **周日 → 周六**；**周键 = 该周周日的日期**（`yyyy-MM-dd`）
- **不要用 ISO 周号**（周一起算，跨年会错位），一律用日期字符串比较
- 未来周不可选、不可录入
- 主要函数：`getTodayString`、`getWeekStart`、`getCurrentWeekStart`、`getWeekStartOf`、`getWeekEnd`、`getRecentWeeks`、`isFutureWeek`、`isValidWeekStart`、`formatWeekLabel`、`formatWeekChip`

## Auth

JWT 存在 httpOnly cookie `session`（7 天）。全部会话相关都在 **`lib/auth.ts`**：`createSession` / `getSession` / `deleteSession` / `getCurrentUser` / `requireUser`（未登录跳 `/login`）/ `requireAdmin`（非管理员跳 `/today`）。

注意：`requireUser` / `requireAdmin` 内部用 `redirect()`，**只适合页面**；Route Handler 里要自己查 `getSession()` + `user.isAdmin` 返回 401/403。

## Route structure

| Path | 说明 |
|------|------|
| `/` | 未登录 → `/login`；管理员 → `/admin/scores`；否则 → `/today` |
| `/login`、`/register` | 公开 |
| `/join` | 加入 / 创建家（邀请码） |
| `/today` | 今日事项，逐项打勾（叶子项可点，父项与分类作分组标题） |
| `/report` | **周表**：周次多选 + 成员卡片视图 / 图表视图（柱状或折线）/ 表格视图（姓名列固定），本家成员可见 |
| `/group` | 本家今日每人完成项数 |
| `/profile` | 昵称、邀请码、反馈、退出 |
| `/admin/scores` | **周分录入**：网格 inline 编辑，自动 / 已锁定 / 恢复自动 |
| `/admin/activities` | 事项模板与条目维护（唯一事项入口，可启用模板） |
| `/admin/{groups,users,feedback}` | 团体 / 用户 / 反馈 |
| `/admin` | 重定向到 `/admin/scores` |

## API routes（Route Handlers）

| Path | Method | 说明 |
|------|--------|------|
| `/api/auth/{login,register,logout}` | POST | 认证 |
| `/api/records` | POST | 打卡切换 `{itemId, date?}`；校验叶子项 + 启用 + 当前模板 |
| `/api/admin/scores` | PUT / DELETE | 录入 / 恢复自动 `{userId, groupId, weekStart, score?}` |
| `/api/admin/activities/templates` | POST | 新建模板 |
| `/api/admin/activities/templates/[id]` | PATCH / DELETE | 改 / 删模板 |
| `/api/admin/activities/templates/[id]/activate` | POST | 把该模板设为当前启用 |
| `/api/admin/activities/items` | POST | 新建事项（含 `checksPerWeek`） |
| `/api/admin/activities/items/[id]` | PATCH / DELETE | 改 / 删事项 |
| `/api/admin/activities/categories` | POST | 新建分类 |
| `/api/admin/activities/categories/[id]` | PATCH / DELETE | 改 / 删分类 |
| `/api/admin/groups/[id]` | PATCH / DELETE | 团体 |
| `/api/admin/feedback/[id]` | PATCH | 处理反馈 |
| `/api/group/{create,join}` | POST | 建家 / 加入 |
| `/api/feedback` | POST | 提交反馈 |

## Conventions

- 所有面向用户的文案用中文
- **读走 Server Component 直连 db；写走 Route Handler + 客户端 fetch**（不使用 Server Actions）
- 需要聚合的数据（周表、录入网格）在**服务端一次算好**再传给客户端，不要下传明细记录
- 日期一律用 `lib/date.ts`，不要自己拼日期
- 样式用 shadcn 语义 token（`bg-card` / `text-muted-foreground` / `success` / `warning`），**不要写死 `text-gray-500` 这类颜色**
- Prisma client 用 `lib/prisma.ts` 单例
- 客户端组件从 `services/*` 只导入**类型**时用 `import type`（`services` 依赖 prisma，不能进客户端包）
