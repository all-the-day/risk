# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**rike** (日课) — An anonymous collaborative daily task/check-in system. Users join groups, complete fixed daily tasks (group tasks like "morning reading" and personal tasks like "drink water"), and see whether the group achieved full completion each day.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (dev), PostgreSQL (prod) via Prisma 6
- **Auth**: JWT in httpOnly cookies (`jose`), passwords hashed with `bcryptjs`
- **Styling**: Tailwind CSS 4 (CSS-based config, not `tailwind.config.js`)
- **Deployment**: Docker-ready

## Commands

```bash
npm run dev          # Start development server
npm run build       # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes (dev)
npm run db:migrate   # Run migrations (prod)
npm run db:seed      # Seed database with initial tasks
```

## Architecture

### Layered Structure

```
app/        → Pages and Route Handlers (API routes)
services/   → Business logic (auth, checkin)
db/         → Data access (thin Prisma wrappers)
lib/        → Utilities: prisma singleton, auth helpers, date helpers
types/      → TypeScript interfaces
components/ → Shared UI components
prisma/     → Schema, migrations, seed
```

### Key Architectural Patterns

- **Server-first**: Use Server Components and Route Handlers; avoid unnecessary client-side fetching
- **Session via JWT cookie**: `lib/auth.ts` sets/reads `session` httpOnly cookie; `db/user.ts` provides `getCurrentUser()` and `requireUser()` / `requireAdmin()` helpers
- **Prisma singleton**: `lib/prisma.ts` prevents connection exhaustion in dev (`globalThis` pattern)
- **Date handling**: `lib/date.ts` provides `getTodayString()` returning `YYYY-MM-DD`

### Data Model

```
User ─┬─→ GroupMember ─→ Group
      └─→ Checkin ─→ Task
      └─→ Feedback
```

Key constraints:
- `Checkin` has `@@unique([userId, taskId, date])` — one checkin per task per day
- `GroupMember` has `@@unique([userId, groupId])` — user can join a group only once
- Tasks are system-preset (no user creation); `enabled` flag for soft-delete
- `Feedback` table exists for bug/feature reports (separate from core loop)

## Route Structure

| Path | Description |
|------|-------------|
| `/` | Redirects: `/login` (unauth) → `/today` or `/admin` (based on `isAdmin`) |
| `/login`, `/register` | Authentication |
| `/join` | Join group via invite code |
| `/today` | User's today's tasks + checkin status (client component) |
| `/group` | Group daily completion status |
| `/profile` | User profile and group membership |
| `/admin/*` | Admin pages (tasks, groups, users, checkins, feedback) — layout requires `isAdmin` |

## API Routes (Route Handlers)

| Path | Method | Description |
|------|--------|-------------|
| `/api/auth/login` | POST | Login with phone + password |
| `/api/auth/register` | POST | Register new user |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/checkin` | POST | Toggle checkin for a task |
| `/api/group/join` | POST | Join group with invite code |
| `/api/group/create` | POST | Create new group |
| `/api/feedback` | POST | Submit bug/feature feedback |
| `/api/admin/tasks/[id]` | PATCH, DELETE | Update/delete tasks |
| `/api/admin/tasks/create` | POST | Create task |
| `/api/admin/groups/[id]` | GET, PATCH, DELETE | Manage groups |
| `/api/admin/checkins` | GET | Query checkins |
| `/api/admin/feedback/[id]` | PATCH | Resolve feedback |

## Tailwind CSS 4 Note

This project uses Tailwind CSS 4, which uses CSS-based configuration (`@theme` in `app/globals.css`) rather than `tailwind.config.js`. Do not create or modify a `tailwind.config.js` file.
