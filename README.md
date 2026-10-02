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
- File uploads (COI/W9/rate-con/BOL/POD) are stored on local disk under `storage/uploads/`,
  served through an authenticated route (`/api/files/[documentId]`) that checks the requester's
  company before returning anything — **dev-only**, swap for S3-compatible storage before any real
  deployment.

## First-time setup

### 1. Install Postgres.app (or point `DATABASE_URL` at any Postgres you have)

Download from **https://postgresapp.com**, drag it to Applications, open it, and click
"Initialize" to start a local Postgres server on port 5432. No Homebrew or Docker needed.

### 2. Create the database

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/createdb truckerz
```

(Or use the Postgres.app GUI's "+" button to add a database named `truckerz`.)

### 3. Configure environment variables

`.env` is already set up for a local default:

```
DATABASE_URL="postgresql://YOUR_MAC_USERNAME@localhost:5432/truckerz"
AUTH_SECRET="dev-only-secret-change-before-any-real-deployment"
```

Confirm `YOUR_MAC_USERNAME` matches `whoami` — Postgres.app creates a default superuser matching
your macOS username with no password. Generate a real `AUTH_SECRET` before deploying anywhere with
`npx auth secret`.

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
role-scoped navigation (Owner/Dispatcher/Office/Driver), the Booked → In Transit → Delivered →
Invoiced → Paid status pipeline (with Delivered never auto-settable), read-only computed payment
fields, dispatcher commission tracking, multi-stop loads, accessorials, the dashboard with its
8 stat cards + 4 charts + a separately-date-ranged "Detailed Analytics" block — is implemented and
working against real data.

## Known items

- `npm audit` currently flags 4 high-severity advisories in Prisma's own transitive dependencies
  (`deepmerge-ts`, bundled `mysql2` driver) — both are in code paths this app never exercises (we
  only use the Postgres adapter), and `npm audit fix --force` would downgrade Prisma to 6.x, which
  uses an incompatible config format from what's wired up here. Worth revisiting when Prisma ships
  a patched 7.x release.
- Search inputs (Trucks/Loads pages) push a new URL on every keystroke rather than debouncing —
  fine for a demo dataset, worth debouncing before it's handling thousands of rows.
- There's no self-serve "forgot password" flow yet, and inviting a teammate in Settings sets their
  password directly rather than emailing an invite link (no email provider wired up yet).

## Project layout

```
prisma/schema.prisma       Data model
prisma/seed.ts              Demo data
src/lib/auth.ts             NextAuth config (Credentials + Prisma)
src/proxy.ts                 Route guard (Next.js 16's middleware replacement; runs on the Node runtime, so it can safely import Prisma)
src/lib/actions/*.ts         Server actions (all mutations go through these)
src/lib/business.ts          Status-pipeline rules + payment amount calculations
src/app/(app)/*               Authenticated pages (dashboard, trucks, loads, payments, expenses, documents, settings)
src/app/login, src/app/signup  Public auth pages
```
