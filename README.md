# TruckerZ

Fleet profit, loads, payments, and expenses for owner-operators and small trucking fleets — built
as a from-scratch clone of FleetChart's feature set, under its own brand.

## Stack

- **Next.js 16** (App Router), TypeScript, React Server Components + Server Actions
- **Tailwind CSS 4**
- **PostgreSQL** via **Prisma 7** (using the `@prisma/adapter-pg` driver adapter — Prisma 7 requires
  an explicit adapter and moved the datasource URL out of `schema.prisma` into `prisma.config.ts`)
- **Auth.js (NextAuth v5)**, Credentials provider, bcrypt password hashing, JWT sessions
- **recharts** for the dashboard charts
- **Supabase** for both the database and file storage — chosen specifically because it's portable:
  a plain Postgres connection string and an S3-compatible storage bucket, neither tied to any one
  host. Works the same from local dev, Vercel, or a plain VPS later.

## First-time setup (Supabase)

### 1. Create a Supabase project

Go to **https://supabase.com**, sign up, create a new project. Save the database password it
generates.

### 2. Get your connection details

- **Project Settings → Database → Connect** — copy **both** pooler connection strings, not the
  direct connection (IPv6-only, often unreachable). Which one you actually use depends on where
  the app runs — see the callout below.
- **Project Settings → API** — copy the **Project URL** and the **`secret` key** (not the
  `publishable`/`anon` one — the secret key is server-only and bypasses storage permissions, so
  never expose it to the browser).

### 3. Configure `.env`

```
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true"
AUTH_SECRET="generate-with-npx-auth-secret"

SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_SECRET_KEY="your-secret-key"
SUPABASE_STORAGE_BUCKET="truckerz-uploads"
```

The `uselibpqcompat=true` flag matters: `pg` v8.23+ otherwise treats `sslmode=require` as full
certificate-chain verification, which fails against Supabase's pooler cert chain. This flag
restores the "encrypt, don't verify" behavior that `require` is supposed to mean.

> **Session pooler (port 5432) vs. transaction pooler (port 6543) — this isn't optional, pick based
> on where `DATABASE_URL` is actually set:**
>
> - **Local dev or a VPS** (one persistent Node process): use the **session pooler**. Supports
>   migrations, advisory locks, everything — it's just a normal connection.
> - **Vercel or any other serverless host**: use the **transaction pooler**. Verified this directly —
>   normal app queries work fine on it (including several fired concurrently, like the dashboard
>   does), but the *session pooler's* connection limit is sized for one persistent server and gets
>   exhausted fast once Vercel spins up multiple function instances under real traffic. That's the
>   actual cause if a deployed page loads fine once and then intermittently 500s.
> - Either way, **run migrations (`prisma migrate deploy`) from a session-pooler connection**, even
>   if the deployed app itself uses the transaction pooler — Prisma's migration engine doesn't
>   reliably work over the transaction pooler (it hangs rather than erroring).

The storage bucket doesn't need to be created by hand — the app creates it automatically (private,
not public) on first upload if it doesn't already exist.

### 4. Install dependencies, migrate, seed

```bash
npm install
npm run db:migrate   # creates all tables from prisma/schema.prisma
npm run db:seed       # loads demo company, users, trucks, loads, payments, expenses
npm run dev
```

Open http://localhost:3000 — you'll land on `/login`.

### Demo logins (after seeding)

| Role       | Email                     | Password      |
|------------|----------------------------|---------------|
| Owner      | owner@truckerz.demo       | password123   |
| Dispatcher | dispatcher@truckerz.demo  | password123   |
| Office     | office@truckerz.demo      | password123   |
| Driver     | driver1@truckerz.demo     | password123   |

Or sign up fresh at `/signup` — that creates a brand-new company with you as Owner and an empty
"Main Fleet".

### Running against local Postgres instead

If you'd rather use a local Postgres (e.g. Postgres.app) for development, just point
`DATABASE_URL` at `postgresql://localhost:5432/truckerz` — the SSL/libpq-compat flags are skipped
automatically for `localhost` (see `src/lib/prisma.ts`). You'd still need Supabase (or an
S3-compatible bucket) for file storage, since that's a separate concern from the database.

## What's real vs. what's scaffolded

This build is **"core app first"**: the full data model, every page, role-based access, the status
pipeline, and all the CRUD you'd touch day to day are real and working against Postgres. What's
explicitly **not** built yet (by design, to ship the core product first):

| Feature (from the reference app) | Status here |
|---|---|
| Rate confirmation PDF → auto-filled load (AI extraction) | **Not built.** "Create with AI" button is visibly disabled in the Loads page. Wiring this up needs a model-provider API key (OpenAI/Anthropic/etc.) and a confidence-threshold + review-queue UI. |
| Motive ELD integration (live map, GPS detention proof, state miles) | **Not built.** Needs a Motive developer/partner account and OAuth flow. |
| EFS / Comdata fuel card statement import | **Not built.** Needs real sample statement exports to build an accurate parser against. |
| IFTA worksheet export | **Not built.** The `Expense` and `Load` models already carry everything needed (state, miles, fuel category) — this is a report/export feature to add on top, not a data-model change. |
| Scheduled email reports + alert emails (detention found, GPS dropped, Monday digest, etc.) | **Not built.** Needs an email provider (Resend/Postmark/SendGrid) and a background job scheduler. |
| Factoring packet PDF export / invoice PDF generation | **Not built.** Documents are stored and linkable to loads today; turning them into a generated PDF packet is additive. |
| Stripe billing for TruckerZ's own subscription plans | **Not built.** Not needed until this goes to real customers. |

Everything else from the walkthrough — multi-tenant companies, multiple fleets per company,
role-scoped navigation (Owner/Dispatcher/Office/Driver, with Drivers and Office never seeing
financial figures, enforced both in the UI and server-side in `src/proxy.ts`), the Booked → In
Transit → Delivered → Invoiced → Paid status pipeline (with Delivered never auto-settable),
read-only computed payment fields, dispatcher commission tracking, multi-stop loads, accessorials,
document uploads to real cloud storage, and the dashboard with its 8 stat cards + 4 charts + a
separately-date-ranged "Detailed Analytics" block — is implemented and working against real data.

## Known items

- `npm audit` currently flags 4 high-severity advisories in Prisma's own transitive dependencies
  (`deepmerge-ts`, bundled `mysql2` driver) — both are in code paths this app never exercises (we
  only use the Postgres adapter), and `npm audit fix --force` would downgrade Prisma to 6.x, which
  uses an incompatible config format from what's wired up here. Worth revisiting when Prisma ships
  a patched 7.x release.
- The Supabase pooler used here is in `ap-northeast-2` (Seoul) — every query pays that round trip
  (roughly 1-2s per page load during testing). Fine for development; before any real usage, create
  the Supabase project in a region close to wherever the app actually runs.
- Supabase's free tier pauses a project after 7 days with no activity (a couple clicks to resume,
  but worth knowing if you want zero chance of that — their paid tier removes it).
- Search inputs (Trucks/Loads pages) push a new URL on every keystroke rather than debouncing —
  fine for a demo dataset, worth debouncing before it's handling thousands of rows.
- There's no self-serve "forgot password" flow yet, and inviting a teammate in Settings sets their
  password directly rather than emailing an invite link (no email provider wired up yet).

## Project layout

```
prisma/schema.prisma       Data model
prisma/seed.ts              Demo data
src/lib/auth.ts             NextAuth config (Credentials + Prisma)
src/lib/supabase-storage.ts  Server-only Supabase Storage client (upload/download)
src/proxy.ts                 Route guard (Next.js 16's middleware replacement; runs on the Node runtime, so it can safely import Prisma)
src/lib/actions/*.ts         Server actions (all mutations go through these)
src/lib/business.ts          Status-pipeline rules + payment amount calculations
src/app/(app)/*               Authenticated pages (dashboard, trucks, loads, payments, expenses, documents, settings)
src/app/login, src/app/signup  Public auth pages
```
