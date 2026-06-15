# Britishce44 — AI Digital School Platform

An all-in-one educational platform for Britishce44 Online Digital School (Taiz, Yemen) with 40 WebRTC classrooms, LMS, AI assistant, exam system, and enterprise management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/britishce44/src/` — React + Vite frontend
- `artifacts/britishce44/src/components/` — layout, auth, classroom, webrtc components
- `artifacts/britishce44/src/pages/` — page components (dashboard, classrooms, etc.)
- `artifacts/britishce44/src/lib/` — WebRTC, signaling, offline-queue utilities
- `artifacts/api-server/src/routes/auth.ts` — auth endpoints (login/register)
- `artifacts/britishce44/src/index.css` — global theme (indigo/sky/green brand system matching the britishce4.com logo)

## Architecture decisions

- App uses state-based navigation (no URL routing) — `DashboardLayout` renders pages via switch on `PageKey`
- Auth state persisted in `localStorage` (`b44_user`, `b44_token`)
- Login calls `/api/v1/auth/login` on the Express API server; api-server has in-memory demo users
- WebRTC via mediasoup-client + socket.io-client; whiteboard uses fabric.js v5 (wildcard import `* as fabric`)
- Tailwind CSS v4 with custom CSS variables for the indigo/sky/green brand theme (deep indigo #150D79, sky #3FBAEB, green #00AE74)

## Product

- Role-based dashboard (admin, supervisor, teacher, student, parent)
- 240 virtual classrooms with WebRTC video, whiteboard, polls, breakout rooms, recording
- Exam system (100 exams, anti-cheat monitor), placement tests, homework dropbox
- CE4 Messenger, AI teacher evaluation, daily performance, triple reports, live analytics
- Auto-messaging AI, marketing suite, AI video editor, video archive

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The `api-server` dev workflow is **build + start** (esbuild bundle, no watch). After editing any backend code you must restart the `artifacts/api-server: API Server` workflow for changes to take effect — there is no hot reload.
- Startup seeding is idempotent and runs on boot; restarting the API server re-seeds safely (no separate seed command needed).
- Google delivery (Gmail/Drive/Calendar) reads live tokens from the Replit connectors proxy (connector names `google-mail`, `google-drive`, `google-calendar`). When not connected, reports stay `emailStatus`/`driveStatus` `pending`; `flushPendingDeliveries()` completes them after authorization.
- AI reports require the Replit AI proxy env (`AI_INTEGRATIONS_OPENAI_*`); without it, generation falls back to a valid bilingual template.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
