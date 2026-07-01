# Deploying Study Buddy — free & permanent

This deploys the whole app as **one free Render web service** (the API also serves
the web UI) backed by a **free Neon Postgres** that never expires. In-memory
Redis (`REDIS_MOCK`) means there's nothing else to provision.

**Cost: $0.** No credit card. Signups needed: GitHub, [Neon](https://neon.tech),
[Render](https://render.com). Plus your OpenAI key for the AI features.

> Why Neon and not Render's database? Render's *free* Postgres **expires after 30
> days**. Neon's free Postgres runs indefinitely. The Render **web service** does
> not expire — it just sleeps after ~15 min idle (≈30–60s cold start on the next
> visit; see "Keep it awake" below).

---

## Step 1 — Free Postgres on Neon (2 min)

1. Sign up at **[neon.tech](https://neon.tech)** (GitHub login, no card).
2. **Create project** (any name/region).
3. On the dashboard, copy the **connection string** — it looks like:
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
   Keep it handy; it's your `DATABASE_URL`.

## Step 2 — Push the code to GitHub

Already a repo? Skip. Otherwise:
```bash
gh auth login
gh repo create studybuddy --private --source=. --remote=origin --push
```

## Step 3 — Deploy on Render (Blueprint)

1. **[dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)** → **New Blueprint Instance**.
2. Connect GitHub, pick your **studybuddy** repo → Render reads [`render.yaml`](render.yaml)
   and shows one service, **studybuddy** (Docker, free).
3. It prompts for the two secret env vars — paste them:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Neon connection string from Step 1 |
   | `OPENAI_API_KEY` | your OpenAI key (`sk-…`) |
   `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are auto-generated.
4. **Apply**. First build takes a few minutes (Docker). On boot it runs
   `prisma db push` to create the schema in Neon, then starts.
5. Open your URL: **`https://studybuddy-xxxx.onrender.com`** — the full app.

## Step 4 — (Optional) Seed a demo account

Render service → **Shell** tab:
```bash
npm run db:prod:seed
```
Login: `demo@studybuddy.app` / `Password123!` — or just register your own.

---

## Keep it awake (optional, free)

Free web services sleep after ~15 min idle. To avoid cold starts, ping `/health`
every ~10 min with a free scheduler like **[cron-job.org](https://cron-job.org)**
or **[UptimeRobot](https://uptimerobot.com)** pointed at
`https://studybuddy-xxxx.onrender.com/health`.

## AI: free / local option

The AI features use OpenAI by default. To run them **with no hosted key** (free),
point the app at a local model instead — set on the service's Environment tab:
```
OPENAI_BASE_URL=http://localhost:11434/v1   # only if the model is reachable from the host
OPENAI_MODEL=llama3.1
OPENAI_JSON_MODE=object
```
(For a cloud deploy, a local Ollama isn't reachable — use an OpenAI key or a free
OpenAI-compatible provider's key here.)

## Custom domain

Render → your service → **Settings → Custom Domains**. Free, with auto TLS. No
env changes needed (single origin).

---

## Notes / scaling

- **Migrations:** the container runs `prisma db push` on boot (fast, fine for now).
  For change tracking, generate migrations against Postgres and switch the
  Dockerfile `CMD` to `prisma migrate deploy`.
- **Schemas:** [`prisma/schema.prisma`](apps/api/prisma/schema.prisma) is the
  local/SQLite default; [`prisma/schema.postgres.prisma`](apps/api/prisma/schema.postgres.prisma)
  is production — keep them in sync.
- **Split deploy (advanced):** to run web and API separately (CDN for static +
  scalable API), use [`apps/api/Dockerfile`](apps/api/Dockerfile) for the API and
  host `apps/web/dist` on Vercel/Netlify/Cloudflare Pages; set the web's
  `VITE_API_URL` to the API origin and the API's `CORS_ORIGINS` to the web origin.

## Local dev

```bash
cp .env.example .env      # already set up locally (SQLite + in-memory Redis)
npm install
npm run dev               # api :4000, web :5173  (or the all-in-one on :4000)
```
