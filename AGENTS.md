# AGENTS.md

## What this is

中文「日课」打卡小组 App。用户加入一个「家」（团体），每天对 CL 事项逐项打勾，系统按周汇总出每个人的周分，成员可查看本家周表，管理员可录入/覆盖周分。MVP 阶段。

**CL** = 本项目的每日打卡内容；每个项目带分值（如 CX 6 分/周、ZR 主日 7 分/周），启用项目分值合计 = 满分（当前 50）。口径来自纸质「团体操练表」：CX 与 追求 一周三次算满分。

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**（`@tailwindcss/postcss`，CSS 内 `@theme` 配置，**不要**建 `tailwind.config.js`）
- **shadcn/ui** 风格组件（`components/ui/*`，基于 `@base-ui/react`）
- **Prisma 6** + **SQLite**（`prisma/dev.db`）
- **jose**（JWT 会话）、**bcryptjs**（口令哈希）、**date-fns**（日期）
- 部署见 `deploy/README.md`（本仓库是部署入口）

## Commands

```bash
npm run dev          # 开发服务器（localhost:3000）
npm run build        # 生产构建
npm run lint         # ESLint
npm run db:generate  # prisma generate
npm run db:push      # 同步 schema 到数据库（无 migration 文件）
npm run db:seed      # 管理员账号 + 9 个默认项目（生产必需）
npm run db:seed:demo # 演示数据：一个家 + 5 位成员 + 最近 3 周打卡记录（开发用）
```

改 schema 后：`db:generate` → `db:push` →（必要时）`db:seed`。
清库重来：删掉 `prisma/dev.db` 后依次 `db:push`、`db:seed`、`db:seed:demo`。注意 cookie 里的 userId 失效，**需要重新登录**。

冒烟测试（需要 dev server 在 3000 端口）：

```bash
npm run db:seed:demo        # 测试依赖演示数据
node test/browser-test.mjs  # 登录 → 打卡 → 报告页 → 后台录入，14 项
```

## Deploy

**构建在 GitHub Actions 完成，生产服务器只接收 `.next/standalone` 产物**（push `main` 自动部署）。服务器只有 1.6G 内存且与其它应用共享，**永远不要在那台机器上跑 `npm ci` / `npm run build`**，会 OOM 拖死整机（2026-09-16 连续死机两次）。产物路径、目录布局、一次性初始化与回滚见 `deploy/README.md`；相关文件是 `.github/workflows/deploy.yml` + `deploy/`。

改代码时注意三点：

- `next.config.js` 的 `output: "standalone"` 与 `outputFileTracingIncludes` 是部署依赖，**别当冗余删掉**。尤其 `node_modules/bcryptjs/**/*` 那条：bcryptjs 在应用里被打进 chunk，但线上 `prisma/seed.cjs` 要 `require` 它，删了建库脚本就跑不起来。
- 线上库是 `file:/var/www/rike/data/prod.db`（绝对路径，在代码目录之外，部署不会碰它）；本地开发仍是 `file:./dev.db`（解析为 `prisma/dev.db`）。
- `prisma/schema.sql` 与 `prisma/seed.cjs` 是 CI 生成的中间产物，**不在仓库里**，别去找；改 schema 后线上要 `bash /var/www/rike/shared/db-init.sh --force`（会清库）。

发版与服务器操作：

- **push `main` = 上线，必须经用户当次明确同意才能 push**；commit 可以自由做。授权按次计算，不从「你自己操作就行」这类宽泛授权里推断。
- 服务器上的**变更**操作走本地 server-ops 项目（`d:/coder/aiWorkSpace/server-ops`）的 `python server-ops.py -s <server> ...`（有审计日志）；MCP ssh 只作只读查询。操作完同步 `docs/servers/<server>.md` 并跑 `drift` 复核。
- 本机 `gh` 命令必须带 `HTTPS_PROXY=http://127.0.0.1:7897`（网络在 H3C TLS 拦截网关后，否则报 x509）；`git push/pull` 已配 CA bundle 直连即可，不用代理。
- Meoo 全栈部署在评估中（阿里秒悟 CLI 已装并授权，主要门槛是 Prisma SQLite → 云数据库）；用户提「迁 Meoo / 试部署」时先给方案再动手。

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
ActivityItem（唯一实体：分值 / 每周次数 / 打卡日 / 个人-团体 / 启用）
        ↓ 每日打勾
  ActivityRecord（userId + itemId + date）
        ↓ 读取时实时汇总
  周分（自动）  ←被覆盖→  WeeklyScore（管理员录入）
```

- **没有模板、没有分类、没有父子层级**（2026-09-17 全部砍掉）：项目（`ActivityItem`）是唯一实体，所有规则直接挂在项目上。
- **项目自带规则**：`score`（每周满分）、`checksPerWeek`（达到几次算满分，超出不再加分但**打卡照记**）、`allowedWeekdays`（打卡日：null=不限，"0"=仅主日，CSV 可多天）、`scope`（"personal" 个人 / "group" 团体）、`order`（显示顺序）、`enabled`。
- **删除是软删除**：`deletedAt` 非空即已删除；已删除项目不出现在管理列表、打卡页、满分计算里，历史打卡记录保留，可在管理页「已删除」里恢复。
- **`enabled=false` 的项目**：打卡页不出现、不计满分（历史打卡记录保留）。

- **每日打卡是打勾式**：`ActivityRecord` 只记「某人某天做了某项」，`@@unique([userId, itemId, date])`。
- **周分不在打卡时落库，读取时实时汇总**——避免"改了算法旧快照不一致"。`WeeklyScore` **行的存在即代表管理员覆盖**（无需 `locked` 字段），「恢复自动」= 删该行。
- **团长（`GroupMember.role = "leader"`）**：一家同时只有一个；建家者即团长，后台可转让。`/report` 与 `/group` 里**团长与全局管理员可见全家数据，普通成员只见自己**。

## Scoring rules（`lib/score.ts`）

- 单次得分 = `item.score / item.checksPerWeek`（`checksPerWeek <= 0` 按 1 兜底）
- 本周次数超过 `checksPerWeek` 封顶（多打不再加分，但记录保留）；不足按已完成次数线性给分
- 内部按「分 × 100」整数累加，展示时四舍五入为整数
- **满分不落库**：`maxScoreOf()`（`lib/score.ts`）= 启用项目分值之和，周表分母/录入上限/打卡页都用它实时算；项目改了就自动跟着变

## Week rules（`lib/date.ts`）

- 一周 = **周日 → 周六**；**周键 = 该周周日的日期**（`yyyy-MM-dd`）
- **不要用 ISO 周号**（周一起算，跨年会错位），一律用日期字符串比较
- 未来周不可选、不可录入
- 主要函数：`getTodayString`、`getWeekStart`、`getCurrentWeekStart`、`getWeekStartOf`、`getWeekEnd`、`getRecentWeeks`、`isFutureWeek`、`isValidWeekStart`、`formatWeekLabel`、`formatWeekChip`
- **打卡日（项目规则）**：`getWeekdayOf` / `parseAllowedWeekdays` / `serializeAllowedWeekdays` / `formatAllowedWeekdays` / `isAllowedOnDate`（0=周日）；打卡页与 `/api/records` 都用它对项目做「今天能不能打卡」过滤与校验

## Auth

JWT 存在 httpOnly cookie `session`（7 天）。全部会话相关都在 **`lib/auth.ts`**：`createSession` / `getSession` / `deleteSession` / `getCurrentUser` / `requireUser`（未登录跳 `/login`）/ `requireAdmin`（非管理员跳 `/today`）。

登录账号是 `User.nickname`（唯一），界面一律用「昵称」；手机号格式的输入会被 `lib/nickname.ts` 的 `validateNickname` 拒绝（登录与注册接口都会校验）。

注意：`requireUser` / `requireAdmin` 内部用 `redirect()`，**只适合页面**；Route Handler 里要自己查 `getSession()` + `user.isAdmin` 返回 401/403。

## Route structure

| Path | 说明 |
|------|------|
| `/` | 未登录 → `/login`；管理员 → `/admin/scores`；否则 → `/today` |
| `/login`、`/register` | 公开 |
| `/join` | 加入 / 创建家（邀请码） |
| `/today` | 今日项目，逐项打勾（只列出今天可打卡的项目；卡片内进度 = 已完成/总数） |
| `/report` | **周表**：周次多选 + 成员卡片视图 / 图表视图（柱状或折线）/ 表格视图（姓名列固定）；团长/管理员看全表，成员仅自己 |
| `/group` | 本家今日完成项数（分母 = 当天可打卡项目数）：团长/管理员看全员，成员仅自己 |
| `/profile` | 昵称、邀请码、反馈、退出 |
| `/admin/scores` | **周分录入**：成员 × 周网格，点格子开抽屉；抽屉里「按总分」（写 WeeklyScore 覆盖）/「按表格」（9 项目 × 7 天矩阵，逐格写打卡记录） |
| `/admin/activities` | **项目管理**（唯一项目入口）：一屏项目列表（搜索、上下移、行内启停、删除）+ 右侧抽屉表单（名称/分值/每周次数/打卡日/类型/启用） |
| `/admin/{groups,users,feedback}` | 团体 / 用户 / 反馈 |
| `/admin` | 重定向到 `/admin/scores` |

## API routes（Route Handlers）

| Path | Method | 说明 |
|------|--------|------|
| `/api/auth/{login,register,logout}` | POST | 认证 |
| `/api/records` | POST | 打卡切换 `{itemId, date?}`；校验项目启用 + 今天是否可打卡 |
| `/api/admin/scores` | PUT / DELETE | 录入 / 恢复自动 `{userId, groupId, weekStart, score?}` |
| `/api/admin/records` | GET / PUT | 管理员代录打卡：GET 读某成员某周明细；PUT `{userId, itemId, date, checked}`（与成员自己打的卡是同一份记录） |
| `/api/admin/activities/items` | POST | 新建项目（`name`、`score`、`checksPerWeek`、`allowedWeekdays`、`scope`） |
| `/api/admin/activities/items/[id]` | PATCH / DELETE | 改项目（`restore: true` = 从回收站恢复）/ 软删除 |
| `/api/admin/groups/[id]` | PATCH / DELETE | 团体改名 / 禁用 / 重置邀请码 / 任命团长（`leaderMemberId`，全家唯一）；DELETE 带 `memberId` 移除成员、不带则删整个团体（级联成员与周分） |
| `/api/admin/users` | POST | 管理员代建账号（不复用 register，避免顶掉管理员会话） |
| `/api/admin/users/[id]` | PATCH / DELETE | 改角色 / 重置密码；删除用户（级联打卡、周分、反馈）；不能操作自己 |
| `/api/admin/feedback/[id]` | PATCH / DELETE | 处理反馈 / 删除反馈 |
| `/api/profile` | PATCH | 修改自己的家内昵称（GroupMember.nickname，不是登录账号） |
| `/api/group/{create,join,leave}` | POST | 建家（建者即团长）/ 加入 / 退出 |
| `/api/feedback` | POST | 提交反馈 |

## Conventions

- 所有面向用户的文案用中文
- **读走 Server Component 直连 db；写走 Route Handler + 客户端 fetch**（不使用 Server Actions）
- 需要聚合的数据（周表、录入网格）在**服务端一次算好**再传给客户端，不要下传明细记录
- 日期一律用 `lib/date.ts`，不要自己拼日期
- 样式用 shadcn 语义 token（`bg-card` / `text-muted-foreground` / `success` / `warning`），**不要写死 `text-gray-500` 这类颜色**
- 前台 tab 页（`/today` `/report` `/group` `/profile`）**不要顶部 header bar**：页面身份由底部导航表达，信息（团体名、人数、日期等）下沉进已有卡片当小字；**页面第一条必须是内容**，不是状态横幅、控件标签
- 表格/矩阵类需求**不要 1:1 复刻纸质表格版式**（那是纸面的局限），先调研同类功能的成熟 UI 再设计；找到参考后给用户看依据再开工
- Prisma client 用 `lib/prisma.ts` 单例
- 客户端组件从 `services/*` 只导入**类型**时用 `import type`（`services` 依赖 prisma，不能进客户端包）
- **项目是唯一实体**：不要再引入模板、分类、父子层级、「事项 vs 项目」两套叫法；规则一律挂在项目上（加 `ActivityItem` 字段 + 抽屉表单项 + 列表列即可）
- 后台增删改查统一走「列表 + 右侧 Sheet 抽屉表单 + AlertDialog 确认 + `toast` 提示」，不要再做行内编辑那种交互

## 协作方式（给 agent 的工作约定）

- **小改动一轮做完就汇报**：改文案/校验/展示类改动自己动手，跑一次 `tsc` / `lint`（必要时一次冒烟）即可，不要形成「验证 → 修复 → 再验证」的链条。判断看风险半径不看文件数：只有数据迁移、删数据、并发/幂等、大范围重构才值得独立验证，且最多一轮，发现小问题顺手修掉再汇报
- **需求清楚就直接实现**，不要默认先做静态原型/对比稿；小分歧（如柱状 vs 折线）直接选一个合理方案，能切换就做成可切换
- 汇报要短：结论 + 证据 + 遗留，不铺开讲过程
