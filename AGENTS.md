# AGENTS.md

## Cursor Cloud specific instructions

### What this is
OneCad BIM ("Hệ Thống Quản Lý Dự Án BIM") — a single Cloudflare Pages + Workers app built with Hono (`src/index.tsx`) and a static SPA frontend (`public/index.html` + `public/static/app.js`). Data lives in a Cloudflare D1 (SQLite) database (binding `DB`). The UI is in Vietnamese. There is only one runtime process; it serves both the API and the frontend. There is no separate backend/frontend split, no `docker-compose`, and no `Makefile`.

The startup dependency refresh (`npm install`) is handled by the Cloud Agent update script, so it is not repeated here.

### Running the app (full-stack, the reliable path)
Standard scripts live in `package.json`. The full-stack dev flow is:

1. `npm run build` — builds the Worker + copies static assets into `dist/`.
2. `npm run db:migrate:local` — applies all `migrations/*.sql` to the local D1 (state stored under `.wrangler/`).
3. `npm run dev:sandbox` — runs `wrangler pages dev dist --d1=bim-management-production --local --ip 0.0.0.0 --port 3000`. App is then at `http://localhost:3000`.

### Non-obvious gotchas
- IMPORTANT: `npm run dev` (plain Vite) does NOT serve the frontend. `GET /` returns HTTP 500 with `ReferenceError: __STATIC_CONTENT_MANIFEST is not defined` because the SPA is served through Hono's Cloudflare `serveStatic` adapter, which only has the asset manifest in the built Pages runtime. API routes (e.g. `/api/...`) do work under `npm run dev` with local D1, but for anything involving the UI you must use `npm run build` + `npm run dev:sandbox` (wrangler pages dev).
- Because `dev:sandbox` serves the prebuilt `dist/`, there is NO hot reload. After editing `src/index.tsx` or `public/` you must re-run `npm run build` (and restart/refresh) for changes to take effect.
- FIRST-RUN DATABASE BOOTSTRAP: after the server is up, call `curl -X POST http://localhost:3000/api/system/init` once. This creates any missing tables, seeds demo data (projects/tasks/etc.), and — critically — sets valid SHA-256 password hashes. The committed `migrations/0002_seed_data.sql` seeds users with placeholder bcrypt-style hashes that do NOT work with the app's SHA-256 login, so `db:seed` alone will not give you a working login. `/api/system/init` is idempotent (it skips re-seeding once `seed_data_initialized` is set).
- Default admin login after init: username `admin`, password `Admin@123456` (seeded non-admin demo users use password `Bim@2024`).
- `start-server.sh` / `ecosystem.config.cjs` (PM2) hardcode `/home/user/webapp/node_modules/.bin/wrangler`, which does not exist here — do not rely on them; run `npm run dev:sandbox` (or `npx wrangler pages dev dist ...`) directly.
- `.wrangler/` (local D1 data) and `dist/` are git-ignored and not persisted in the repo; rebuild + re-migrate + re-init in a fresh workspace.

### Tests / lint / build
- There is NO test framework, linter, or formatter configured (no `test`/`lint` scripts, no eslint/vitest/jest/prettier). Verification is manual against the running app on port 3000.
- Build check: `npm run build` (also `npm run cf-typegen` regenerates Worker binding types).

### Optional / external integrations (not required to run)
- Email (Resend) and Web Push (VAPID) are optional and configured at runtime via the `system_config` DB table / admin UI, not via env vars — the app runs fine without them.
- The browser UI loads libraries (Tailwind, Chart.js, Axios, dayjs, xlsx, FontAwesome) from public CDNs, so full frontend rendering needs internet access.
