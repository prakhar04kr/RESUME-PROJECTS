# TypeRacer

A competitive real-time typing speed game where players race against their personal bests and a global leaderboard. Type fast, climb the ranks.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, also serves WebSocket at /ws)
- `pnpm --filter @workspace/typeracer run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `REDIS_URL` — Redis connection string (leaderboard caching, defaults to redis://localhost:6379, gracefully degrades if unavailable)
- Optional env: `JWT_SECRET` — JWT signing secret (defaults to dev secret)

## Seed Credentials

- Admin: `admin@typeracer.com` / `Admin1234!` (role: admin)
- Demo user: `demo@typeracer.com` / `Password1!`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18, Vite, React Query, Wouter, Tailwind CSS, shadcn/ui
- API: Express 5 + ws (WebSocket)
- DB: PostgreSQL + Drizzle ORM
- Cache: Redis (ioredis) — optional, graceful fallback
- Auth: JWT (jsonwebtoken) + bcrypt
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/` — Drizzle table definitions (users, games, results)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, games, results, leaderboard)
- `artifacts/api-server/src/lib/` — jwt.ts, redis.ts, socket.ts (WebSocket server)
- `artifacts/api-server/src/middlewares/authGuard.ts` — JWT auth + adminOnly guards
- `artifacts/typeracer/src/pages/` — game, auth, leaderboard, results, history, admin
- `artifacts/typeracer/src/hooks/` — use-typing, use-wpm, use-timer, use-socket
- `artifacts/typeracer/src/lib/auth.tsx` — AuthProvider + useAuth context

## Architecture decisions

- WebSocket server shares the same HTTP server as Express via `createServer(app)`. The /ws path is listed in artifact.toml paths so the proxy forwards WS upgrades correctly.
- Redis caching is optional and silently degrades — the leaderboard falls back to PostgreSQL if Redis is unavailable.
- Leaderboard uses raw SQL (via pg pool directly) for the `DISTINCT ON` PostgreSQL-specific query that can't be expressed cleanly in Drizzle.
- JWT tokens stored in localStorage; session restored on mount via GET /api/auth/me.
- bcrypt salt rounds: 12. JWT expiry: 7 days.

## Product

- **Home** — hero CTA, leaderboard preview, personal stats when logged in
- **Game** — random paragraph typed with live WPM/accuracy/timer, character coloring (green=correct, red=error), WebSocket-powered live tick
- **Results** — big WPM headline, accuracy color indicator, paragraph replay, personal best comparison
- **Leaderboard** — top typists with difficulty filter tabs, gold/silver/bronze badges, current user row highlighted
- **History** — paginated personal race history
- **Admin** — game (paragraph) CRUD panel, inline edit, char counter, role-gated

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always restart the API server workflow after code changes (it builds on start)
- The leaderboard uses `DISTINCT ON (user_id)` — best result per user — requires PostgreSQL
- Redis is optional; the app works without it (just no caching)
- Run `pnpm --filter @workspace/api-spec run codegen` after every OpenAPI spec change
- Admin role must be set via SQL: `UPDATE users SET role = 'admin' WHERE email = '...'`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
