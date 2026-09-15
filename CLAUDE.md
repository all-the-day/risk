# CLAUDE.md

本仓库的项目说明统一维护在 **[AGENTS.md](./AGENTS.md)** —— 技术栈、命令、分层、领域模型（CL 事项 → 每日打卡 → 周分）、周与计分规则、路由与接口清单、编码约定都在那里，请先读它。

这里只补充 Claude Code 相关的两点：

- 冒烟测试：`npm run db:seed:demo && node test/browser-test.mjs`（需 dev server 在 3000 端口）
- 改 schema 后必须 `npm run db:generate && npm run db:push`
