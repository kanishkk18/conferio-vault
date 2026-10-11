# Deploying SecureVault

Two apps to deploy: `apps/web` (the product) and `apps/admin` (internal, keep it off any
public domain your users would guess — e.g. `admin-internal.yourdomain.com`, not
`admin.yourdomain.com`).

---

## 0. Provision the infrastructure (same for either deployment path)

1. **Postgres** — [Neon](https://neon.tech) or [Supabase](https://supabase.com) both have
   free tiers and give you a `DATABASE_URL` immediately. (Or your own Postgres on the
   Hostinger VPS if you're going fully self-hosted.)
2. **Redis** — [Upstash](https://upstash.com), free tier, gives you
   `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
3. **Object storage** — Cloudflare R2. Create a bucket, then an API token scoped to it, for
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.
4. **Secrets** — generate two independent random secrets:
   ```bash
   openssl rand -base64 32   # -> BETTER_AUTH_SECRET (web app)
   openssl rand -base64 32   # -> ADMIN_MASTER_KEY (MUST be identical in both apps' env)
   ```
   Generate a *third*, separate `BETTER_AUTH_SECRET` for the admin app (it doesn't need to
   match the web app's).
5. **Google OAuth** (optional, only if you want "Continue with Google") — create credentials
   at the Google Cloud Console, add your deployed web URL's `/api/auth/callback/google` as an
   authorized redirect URI.
6. **Resend** (optional, for verification/reset emails) — get an API key. If you skip this,
   the app logs emails to the server console instead of sending them — fine for a college
   project demo, not for real users.

Push migrations once you have `DATABASE_URL`:
```bash
pnpm --filter @securevault/database db:push
```
(`db:push` syncs the schema directly, no migration history — simplest for getting started.
Switch to `prisma migrate dev` / `migrate deploy` if you want real migration history later.)

---

## Option A — Vercel (easiest)

1. Push this repo to GitHub.
2. In Vercel, **New Project** → import the repo → when it asks for the root directory,
   create **two separate Vercel projects** from the same repo:
   - Project 1: Root Directory = `apps/web`
   - Project 2: Root Directory = `apps/admin`
   Vercel auto-detects the pnpm workspace and Turborepo — no extra build config needed.
3. In each project's **Settings → Environment Variables**, add the variables from
   `.env.example` (web) and `apps/admin/.env.example` (admin). Set:
   - `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL` = your web app's Vercel URL
   - `ADMIN_APP_URL` = your admin app's Vercel URL
   - `ADMIN_MASTER_KEY` — same value in both projects
4. Deploy. Vercel handles HTTPS automatically.
5. Register your first account at `<web-url>/register`, then promote it to admin — see
   below.

---

## Option B — Self-hosted (Dokploy on your Hostinger VPS)

This repo now includes production `Dockerfile`s for both apps (`apps/web/Dockerfile`,
`apps/admin/Dockerfile`), using Turborepo's `prune` pattern for lean images.

1. In Dokploy, create two applications, both pointing at this Git repo:
   - App 1: Dockerfile path `apps/web/Dockerfile`, build context = repo root, port `3000`
   - App 2: Dockerfile path `apps/admin/Dockerfile`, build context = repo root, port `3001`

   (Build context must be the **repo root**, not the app subfolder — the Dockerfiles run
   `turbo prune` from the monorepo root and need the whole workspace to do that.)
2. Add the same environment variables as the Vercel path, in each app's Dokploy env
   settings.
3. Point a domain/subdomain at each app through Dokploy's Traefik integration.
   **Known issue from earlier**: you previously hit Traefik/Let's Encrypt SSL failures
   tied to broken IPv6 connectivity on this VPS. If that resurfaces, disable IPv6 in
   Traefik's entrypoint config or force IPv4-only ACME resolution — that was the root
   cause last time, not a Dokploy or app-level problem.
4. Deploy both apps. Run the DB push from your own machine (pointed at the same
   `DATABASE_URL`) or exec into a running container:
   ```bash
   pnpm --filter @securevault/database db:push
   ```

---

## Promoting an account to admin

Admin accounts are never self-registered — the admin app's sign-up endpoint is disabled on
purpose. Promote an existing account after they've registered normally on the web app:

```bash
pnpm --filter @securevault/database promote-admin kanishkk.bansal18@gmail.com
pnpm --filter @securevault/database promote-admin vk181855@example.com
```

(Run this from a machine with `DATABASE_URL` pointed at your production database — locally
against a `.env` in `packages/database`, or via your deployment platform's shell/console.)

Each person must **register a normal account first** (at `<web-url>/register`) — the script
only flips the `role` field on an existing user, it can't create one. Once promoted, they
sign in at `<admin-url>/login`, not the web app's login.

To check who's currently an admin, or to demote someone, use Prisma Studio:
```bash
pnpm --filter @securevault/database db:studio
```
and edit the `role` column on the `user` table directly (values: `"user"` / `"admin"`).

---

## Post-deploy checklist

- [ ] `pnpm --filter @securevault/database db:push` has run against production
- [ ] Register an account, verify email works (or check server logs if Resend isn't configured)
- [ ] Promote that account to admin, confirm you can sign in at the admin app
- [ ] Upload a test file, confirm it shows up decrypted in the admin panel's user detail page
- [ ] Confirm `ADMIN_MASTER_KEY` is byte-for-byte identical between the web and admin apps
      (a mismatch means admin decryption will fail with an auth-tag error — check this first
      if media views 500 in the admin panel)
