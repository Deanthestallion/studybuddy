# Study Buddy 📚

An all-in-one digital study companion that helps students plan, stay motivated, collaborate, and improve academic performance.

This repository is a **production-ready, horizontally-scalable MVP** built as a TypeScript monorepo. It is intentionally minimal in surface area but architected to scale from the first user to millions without re-platforming.

---

## 1. System Architecture

### 1.1 High-level diagram

```
                                  ┌─────────────────────────┐
                                  │      Client (SPA)       │
                                  │  React + Vite + TS      │
                                  │  apps/web               │
                                  └────────────┬────────────┘
                                               │ HTTPS / JSON
                                               │ (access token in memory,
                                               │  refresh token httpOnly cookie)
                                               ▼
                            ┌──────────────────────────────────────┐
                            │         Edge / Load Balancer          │
                            │   (CDN for static, LB for API)        │
                            └───────────────────┬──────────────────┘
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        │            API tier (stateless, N pods)        │
                        │  Node.js + Express + TS  (apps/api)            │
                        │  routes → controllers → services → repository  │
                        │  JWT auth · zod validation · rate limiting     │
                        └───────┬───────────────────────────┬───────────┘
                                │                           │
                   ┌────────────▼───────────┐   ┌───────────▼────────────┐
                   │      PostgreSQL         │   │         Redis          │
                   │  Primary + read replicas│   │  sessions / cache /    │
                   │  (Prisma ORM)           │   │  rate-limit / queues   │
                   └─────────────────────────┘   └────────────────────────┘
```

### 1.2 Why this scales to millions

| Concern | Decision | Why it scales |
|---|---|---|
| **Compute** | Stateless API pods behind a load balancer | Add pods linearly; no sticky sessions |
| **State** | All session/refresh-token state in Redis, not memory | Any pod serves any request |
| **Data** | PostgreSQL with Prisma; every table indexed on `userId` + access patterns | Read replicas + connection pooling (PgBouncer) handle read scale |
| **Auth** | Short-lived JWT access tokens (stateless verify) + rotating refresh tokens (Redis) | No DB hit on the hot path for every request |
| **Caching** | Redis cache-aside for dashboards/analytics | Offloads expensive aggregations |
| **Rate limiting** | Redis sliding-window per IP + per user | Protects the platform; distributed across pods |
| **Async work** | Reminder/notification jobs designed as queue producers (Redis/BullMQ-ready) | Decouple slow work from request path |
| **Boundaries** | Feature-module architecture (one folder per domain) | Any module can be extracted into a microservice later with zero domain rewrite |

### 1.3 Request lifecycle

```
HTTP → helmet/cors → request-id + pino logger → rate-limit → body parse
     → route → auth middleware (verify JWT) → zod validate → controller
     → service (business logic) → Prisma/Redis → response
     → centralized error handler (AppError → typed JSON)
```

---

## 2. Tech Stack

**Backend** — Node 20, TypeScript, Express, Prisma ORM, PostgreSQL 16, Redis 7, zod, pino, jsonwebtoken, bcrypt, helmet.
**Frontend** — React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Zustand (auth store), Axios.
**Shared** — `packages/shared` holds zod schemas + inferred types used by *both* API and web (single source of truth, no drift).
**Infra** — Docker + docker-compose for local parity; 12-factor config; Prisma migrations.

---

## 3. File Structure

```
studybuddy/
├── README.md                      # this document
├── docker-compose.yml             # postgres + redis + api + web for local dev
├── package.json                   # npm workspaces root
├── .env.example                   # every required env var, documented
├── docs/
│   └── legacy-prototype.jsx       # original single-file UI prototype (reference)
├── packages/
│   └── shared/                    # shared zod schemas & TS types (DTO contracts)
│       └── src/
│           ├── index.ts
│           └── schemas/           # auth, subject, assignment, note, flashcard, quiz, session
├── apps/
│   ├── api/                       # backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # database schema (source of truth)
│   │   │   └── seed.ts             # demo data
│   │   └── src/
│   │       ├── index.ts            # process bootstrap (listen, graceful shutdown)
│   │       ├── app.ts              # express app assembly
│   │       ├── config/env.ts       # validated env config
│   │       ├── lib/                # prisma, redis, logger singletons
│   │       ├── utils/              # AppError, jwt, password, asyncHandler
│   │       ├── middleware/         # auth, validate, error, rateLimit, requestContext
│   │       └── modules/            # ONE FOLDER PER DOMAIN
│   │           ├── auth/           # {routes,controller,service}.ts
│   │           ├── users/
│   │           ├── subjects/
│   │           ├── assignments/
│   │           ├── notes/
│   │           ├── flashcards/     # decks, cards, SM-2 spaced repetition
│   │           ├── quizzes/        # quizzes, questions, attempts + scoring
│   │           ├── sessions/       # pomodoro / study session logging + XP
│   │           └── dashboard/      # aggregated read model
│   └── web/                        # frontend
│       └── src/
│           ├── main.tsx · App.tsx
│           ├── lib/api.ts          # axios client w/ token refresh interceptor
│           ├── store/auth.ts       # Zustand auth store
│           ├── hooks/              # typed TanStack Query hooks per resource
│           ├── components/         # layout, ui primitives, route guards
│           └── pages/              # Login, Register, Dashboard, Planner, Notes…
```

**Module convention** (every domain folder): `*.routes.ts` (HTTP wiring) → `*.controller.ts` (req/res, no logic) → `*.service.ts` (business logic + data access). This keeps HTTP, orchestration, and persistence cleanly separable and unit-testable.

---

## 4. Database Schema

Postgres via Prisma. Full schema in [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma). Summary:

```
User ──1:N─→ Subject ──1:N─→ (Assignment, Note, FlashcardDeck, Quiz)
 │           Assignment ──N:1─→ Subject (nullable)
 │           Note        ──N:1─→ Subject (nullable)
 │           FlashcardDeck ──1:N─→ Flashcard (per-card SM-2 review state)
 │           Quiz ──1:N─→ Question ; Quiz ──1:N─→ QuizAttempt
 │           StudySession (pomodoro/timer logs, fuels analytics + XP)
 └──1:1─→ profile fields (xp, level, streak, theme) + RefreshToken/Reset via Redis
```

Every user-owned row carries `userId` (indexed) so queries are tenant-scoped and shardable by user. Timestamps (`createdAt`/`updatedAt`) everywhere. Soft-delete-ready via `deletedAt` on high-value tables.

---

## 5. API Endpoints

Base path: `/api/v1`. All non-auth routes require `Authorization: Bearer <accessToken>`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account, returns access token (+ refresh cookie) |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/refresh` | Rotate refresh token → new access token |
| POST | `/auth/logout` | Revoke refresh token |
| POST | `/auth/password/forgot` | Issue reset token |
| POST | `/auth/password/reset` | Reset with token |
| GET  | `/auth/me` | Current user profile |

### Resources (all CRUD, user-scoped, paginated where listed)
| Resource | Endpoints |
|---|---|
| Subjects | `GET/POST /subjects` · `GET/PATCH/DELETE /subjects/:id` |
| Assignments | `GET/POST /assignments` (filter: `?status,subjectId,priority`) · `GET/PATCH/DELETE /assignments/:id` · `POST /assignments/:id/toggle` |
| Notes | `GET/POST /notes` (`?search,folder`) · `GET/PATCH/DELETE /notes/:id` |
| Flashcards | `GET/POST /flashcards/decks` · `GET/PATCH/DELETE /flashcards/decks/:id` · `POST /flashcards/decks/:id/cards` · `PATCH/DELETE /flashcards/cards/:id` · `GET /flashcards/decks/:id/review` (due cards) · `POST /flashcards/cards/:id/review` (SM-2 grade) |
| Quizzes | `GET/POST /quizzes` · `GET/PATCH/DELETE /quizzes/:id` · `POST /quizzes/:id/attempts` (submit → score) · `GET /quizzes/:id/attempts` |
| Study sessions | `GET/POST /sessions` (log pomodoro) |
| Dashboard | `GET /dashboard` (aggregated home model) · `GET /dashboard/analytics?range=` |

Standard response envelope: `{ "data": ... }` on success, `{ "error": { "code", "message", "details?" } }` on failure. Lists return `{ "data": [...], "meta": { "page", "pageSize", "total" } }`.

---

## 6. UI Architecture

- **SPA** with React Router; route-level code splitting (`React.lazy`).
- **Server state** via TanStack Query (caching, retries, optimistic updates) — one typed hook file per resource (`hooks/useAssignments.ts`).
- **Auth state** via a tiny Zustand store; access token kept in memory, refresh token in httpOnly cookie. Axios interceptor transparently refreshes on 401.
- **Protected routes** via a `<RequireAuth>` guard wrapping the app shell.
- **Design system** in `components/ui` (Button, Card, Input, Modal) — Tailwind, light/dark mode, mobile-first, accessible.
- **Contracts shared** with backend via `@studybuddy/shared` so request/response shapes can never drift.

```
<AuthProvider> → <QueryClientProvider> → <Router>
   /login /register                → public
   <RequireAuth><AppLayout>        → /  /planner  /notes  /flashcards  /quizzes  /settings
```

---

## 7. Getting Started

### Prerequisites
- Node 20+, npm 10+
- Docker (for Postgres + Redis), or local Postgres 16 + Redis 7

### Quick start (Docker for infra, run apps locally)
```bash
cp .env.example .env                 # fill in or keep defaults
npm install                          # installs all workspaces
docker compose up -d postgres redis  # start datastores
npm run db:migrate -w @studybuddy/api # apply schema
npm run db:seed   -w @studybuddy/api # demo data (demo@studybuddy.app / Password123!)
npm run dev                          # api on :4000, web on :5173
```

### Full Docker
```bash
docker compose up --build            # everything containerized
```

### Useful scripts (root)
| Script | Action |
|---|---|
| `npm run dev` | api + web in watch mode |
| `npm run build` | typecheck + build all workspaces |
| `npm run db:migrate -w @studybuddy/api` | run Prisma migrations |
| `npm run db:studio -w @studybuddy/api` | open Prisma Studio |

---

## 8. Production hardening checklist (next steps)

The MVP ships with the foundations; these are the deltas to "battle-tested at scale":

- [ ] BullMQ workers for reminders/notifications/emails (producers already factored out)
- [ ] PgBouncer + read replicas; Prisma read/write split
- [ ] OpenTelemetry traces + Prometheus metrics + Grafana dashboards
- [ ] CDN for `apps/web` build; signed-cookie sessions on the edge
- [ ] OAuth (Google/Apple) — auth module already isolates the credential strategy
- [ ] WebSocket gateway for Study Groups realtime chat
- [ ] Per-tenant data partitioning / sharding by `userId` hash when a single primary saturates
- [ ] E2E (Playwright) + load tests (k6) in CI

---

## 9. What is implemented in this MVP

✅ Auth (register/login/refresh-rotation/logout/password-reset/me) with hashed passwords & rotating tokens
✅ Subjects, Assignments, Notes — full CRUD, validation, pagination/filtering
✅ Flashcards with SM-2 spaced repetition
✅ Quizzes with attempts + automatic scoring
✅ Study sessions (Pomodoro) feeding XP/level/streak gamification
✅ Aggregated Dashboard + analytics read model with Redis caching
✅ Frontend: auth flow, protected app shell, dashboard, planner, notes — wired to the live API
✅ Shared zod contracts, centralized errors, rate limiting, structured logging, Docker, seed data
