# AGENTS.md

## What this is

A Chinese-language anonymous daily task group app ("每日功课"). Users join groups, complete preset daily tasks, and see if the whole group finished today. MVP stage.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`, not the v3 plugin)
- **Prisma 6** with **SQLite** (`prisma/dev.db`) — not PostgreSQL despite what TECH_STACK_PLAN.md says
- **jose** for JWT auth (not jsonwebtoken)
- **bcryptjs** for password hashing
- **date-fns** for date formatting

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # production build
npm run lint         # eslint (next/core-web-vitals)
npm run db:generate  # prisma generate (regenerate client)
npm run db:push      # prisma db push (sync schema to DB, no migration files)
npm run db:seed      # seed tasks from prisma/seed.json via prisma/seed.ts
```

No test suite exists. No typecheck script — TypeScript checking happens during `next build`.

After schema changes, run `db:generate` then `db:push`. There is no `db:migrate` workflow in active use.

## Architecture

Single-package fullstack app. Layered, not monorepo:

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| Pages & Route Handlers | `app/` | UI + API endpoints |
| Business logic | `services/` | Auth, checkin logic |
| Data access | `db/` | Prisma queries, user/group/task/checkin CRUD |
| Shared utils | `lib/` | `auth.ts` (JWT sessions), `prisma.ts` (client singleton), `date.ts`, `utils.ts` |
| Types | `types/index.ts` | Shared TypeScript interfaces |

Route structure:
- `app/(main)/` — route group for authenticated pages (currently empty, pages are at root level: `app/today/`, `app/group/`, `app/profile/`)
- `app/login/`, `app/register/`, `app/join/` — public pages
- `app/api/auth/{login,logout,register}/` — auth endpoints
- `app/api/checkin/` — checkin toggle endpoint
- `app/api/group/{create,join}/` — group endpoints

## Auth

JWT stored in httpOnly cookie named `session`. 7-day expiry. Use `getSession()` in server components, `requireUser()` to redirect to `/login` if unauthenticated.

## Database

SQLite. Schema at `prisma/schema.prisma`. Key constraints:
- `GroupMember` has `@@unique([userId, groupId])` — one membership per user per group
- `Checkin` has `@@unique([userId, taskId, date])` — one checkin per user per task per day
- `Checkin.date` is a string in `yyyy-MM-dd` format (not a DateTime)
- Tasks are system-preset; users cannot create/edit/delete tasks
- Task types: `"group"` or `"personal"` (stored as plain strings, not enums)

## Path alias

`@/*` maps to project root. Use `@/lib/prisma`, `@/services/auth`, etc.

## Conventions

- All user-facing text is in Chinese
- Server Actions are enabled (`experimental.serverActions.allowedOrigins`)
- Prisma client is a singleton in `lib/prisma.ts` (global caching for dev hot-reload)
- Date utility `getTodayString()` returns `yyyy-MM-dd` — use it for all date-based queries
