# Deploying Study Buddy

The repo is production-ready. Fastest path is **one platform (Render)** via the
included [`render.yaml`](render.yaml) blueprint — it provisions Postgres, Redis,
the API, and the static web app together.

You need two free accounts: **GitHub** (to host the code) and **Render**
(to run it). Email (password reset) is optional and can be added later.

---

## Step 1 — Push the code to GitHub

A local git repo with an initial commit already exists. Create a remote and push:

```bash
# authenticate once (opens a browser)
gh auth login

# create the repo and push (private)
gh repo create studybuddy --private --source=. --remote=origin --push
```

No `gh`? Create an empty repo on github.com, then:
```bash
git remote add origin https://github.com/<you>/studybuddy.git
git push -u origin main
```

## Step 2 — Deploy on Render

1. In Render: **New ▸ Blueprint**, connect your GitHub, pick the `studybuddy` repo.
2. Render reads `render.yaml` and shows 4 resources (db, redis, api, web). Click **Apply**.
3. Wait for the first build. `JWT_*` secrets are generated automatically;
   `DATABASE_URL` and `REDIS_URL` are wired automatically.

## Step 3 — Connect the two service URLs (one-time)

After the services exist, set the cross-references (Service ▸ **Environment**):

| Service | Variable | Value |
|---|---|---|
| `studybuddy-api` | `CORS_ORIGINS` | the web URL, e.g. `https://studybuddy-web.onrender.com` |
| `studybuddy-api` | `APP_WEB_URL` | same web URL |
| `studybuddy-web` | `VITE_API_URL` | the API URL + `/api/v1`, e.g. `https://studybuddy-api.onrender.com/api/v1` |

Then **Manual Deploy ▸ Clear build cache & deploy** the web service (Vite inlines
`VITE_API_URL` at build time). The API redeploys automatically on env change.

## Step 4 — (Optional) Seed demo data

From the `studybuddy-api` service **Shell** tab:
```bash
npm run db:prod:seed
```
Login: `demo@studybuddy.app` / `Password123!`

---

## Email (password reset) — optional

Without SMTP, reset links are logged, not emailed (the rest of the app is fully
functional). To enable real emails, set `SMTP_URL` on `studybuddy-api`:

```
# Resend / SES / Postmark / SendGrid / Mailgun all give SMTP creds
SMTP_URL=smtps://USER:PASSWORD@smtp.resend.com:465
EMAIL_FROM=Study Buddy <no-reply@yourdomain.com>
```
(Verify your sender domain with the provider so mail isn't marked spam.)

## Custom domain

Add your domain to **both** services in Render (DNS is auto-guided), then update
`CORS_ORIGINS`, `APP_WEB_URL`, and `VITE_API_URL` to the custom hosts and redeploy
the web service.

---

## Notes for scale / production hardening

- **Free tier** spins services down on inactivity (cold starts) and the free
  Postgres expires after 90 days — upgrade those plans before real traffic.
- **Migrations**: deploys currently `prisma db push` the schema (fast, fine for
  first launch). For change tracking, generate migrations against Postgres and
  switch the Dockerfile `CMD` to `prisma migrate deploy --schema prisma/schema.postgres.prisma`.
- **Two schemas**: [`prisma/schema.prisma`](apps/api/prisma/schema.prisma) is the
  local/SQLite default; [`prisma/schema.postgres.prisma`](apps/api/prisma/schema.postgres.prisma)
  is production. Models are identical — keep them in sync if you change one.

## Alternative stack (best-of-breed instead of all-Render)

If you prefer: **Neon** (Postgres) + **Upstash** (Redis) + **Render/Railway/Fly**
(API container) + **Vercel** (web) + **Resend** (email). Set the same env vars;
the API Dockerfile and the web build are unchanged. Point `VITE_API_URL` at your
API host and `CORS_ORIGINS`/`APP_WEB_URL` at your Vercel domain.
```bash
# web on Vercel (from apps/web), API base set via env:
#   VITE_API_URL = https://<your-api-host>/api/v1
```
