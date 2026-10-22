# Vuneliq

A donation and impact tracker for a single organisation. Record money and physical goods, allocate resources to campaigns, track expenditure and distributions, and publish measured outputs.

## Run locally

Requires **Node.js 24 or later** (the server uses built-in SQLite).

```bash
npm ci
npm run dev
```

Vite opens an interactive **browser-only demo** at http://localhost:5173. Demo records persist in localStorage. Role switching is explicitly a preview, not authentication. Use fictional information.

## Run the shared application with real sign-in

```bash
npm run build
ADMIN_EMAIL=you@example.org ADMIN_PASSWORD='choose-a-long-unique-password' npm start
```

Open http://localhost:3000. The app detects the server automatically. Visitors see only published campaigns and results; use **Staff / donor login** to sign in. There are no default passwords. Account passwords must contain at least 12 characters.

Provision optional accounts at startup with `FINANCE_EMAIL`/`FINANCE_PASSWORD`, `PROJECT_EMAIL`/`PROJECT_PASSWORD`, and `DONOR_EMAIL`/`DONOR_PASSWORD`. The sample donor account is linked to the fictional Ada Okafor. Existing account credentials are not overwritten at startup. Provisioning is deliberately server-side; do not put these variables in frontend/VITE variables.

Without `DATABASE_URL`, SQLite data persists in `data/vuneliq.sqlite`. With `DATABASE_URL`, records, accounts and sessions live in external PostgreSQL (Supabase). Set `DATA_DIR` to a persistent volume when hosting. Back up the database using a SQLite-aware backup process. Set `PORT` if required. Use HTTPS and `NODE_ENV=production` on a deployed server (session cookies then require HTTPS). This server needs a Node host with a persistent disk, not static-only Vercel hosting. Vite's static demo can be hosted separately, but it is not the shared application.

## Implemented

- Responsive dashboard, campaign management and publication.
- Money stored in integer kobo; goods tracked by receipt, item and unit.
- Donation entry, split allocations, expenditure and goods distributions with balance guards.
- Output targets, results, evidence **notes**, administrator publication.
- Donation search/type filters and safe CSV exports.
- Public summaries, donor history and staff activity views.
- Server sessions with HttpOnly cookies, scrypt password hashes and login throttling.
- Server role checks, transactional writes, optimistic version checks and server-generated audit events.

## Important scope limitations

This is an assessed MVP foundation, not production-ready accounting software. The implementation uses **React/Vite + a Node/SQLite server**, rather than the planning document's Next.js/Supabase recommendation, so it can run without external credentials.

Not yet implemented: private evidence **file uploads**, a complete void/correction workflow, profile/account-management screens, separate reusable donor directory, payment methods on cash records, multi-period indicator aggregation/deduplication, campaign-level transaction drilldowns, password reset, public account registration and automated email. No online payments, refunds, currencies other than NGN, donated services or beneficiary personal records. Existing posted financial records are immutable; do not work around corrections by making negative records.

Evidence notes are private to staff; public publication exposes the output and method, not the note. Results currently represent dated observations and should not be summed as unique beneficiary counts. Seed data is illustrative, including one result awaiting review; do not treat it as reconciled real project evidence.

The Node server serialises workspace changes in database transactions and rejects stale versions with HTTP 409. Refresh and reapply your change if another team member has saved first. Audit history is server-generated; browser demo history is user-editable and not trustworthy.

## Quality checks

```bash
npm test
npm run build
```

Tests cover reconciliation, exclusion of goods values from cash, invalid usage, CSV safety, server permissions, donor privacy and stale writes.

## Project structure

- `src/main.tsx`: interface and workflow forms
- `src/store.ts`: types and fictional demo dataset
- `src/domain.mjs`: calculations and CSV helpers
- `server/index.mjs`: HTTP server, authentication and persistence
- `server/validate.mjs`: permission and integrity validation
- `tests/`: business-rule and server integration checks

Team repository: https://github.com/olayinkaojo/vuneliq

## Deploy to Render Free with Supabase

The `render.yaml` Blueprint creates one **free Node web service**, with **no paid disk or Render database**. Supabase PostgreSQL stores records, password hashes and sessions outside Render, so they survive Render restarts. Local SQLite remains available for development. This uses Supabase as a PostgreSQL host; it does not use Supabase Auth.

1. In your intended Supabase project, open **Connect → Session pooler** and copy the PostgreSQL URI. Use the supplied project-specific host/username, port 5432, database password, and TLS. URL-encode special characters in the password. Do not paste the URI in chat or commit it.
2. In Render choose **New → Blueprint**, select `olayinkaojo/vuneliq` and branch `main`, and use `render.yaml`.
3. Confirm the service is **Free** and has no paid resources. Enter `DATABASE_URL`, `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters in Render's private environment fields.
4. Deploy and open the assigned HTTPS URL. `/api/health` should return `{"status":"ok"}` after checking the database. Use **Staff / donor login**.
5. If TLS reports an unknown certificate authority, obtain the database CA certificate from Supabase and set `DATABASE_CA_CERT` in Render. Certificate verification is never disabled.
6. Verify a fictional record survives a Render restart. Review accounts and records in the intended project before inviting the team.

The connection needs permission to create the isolated `vuneliq` schema and its `workspace`, `users` and `sessions` tables. They are not in the public API schema, and privileges for PUBLIC are revoked. Use a dedicated project or appropriate server database role. The server initialises fictional seed records only when the workspace is empty; it never overwrites an existing workspace. It does not automatically migrate a previous local SQLite file.

`REQUIRE_DATABASE_URL=true` stops startup if the external database is missing; it never silently falls back to temporary Render storage. The app keeps existing session authentication and role checks. Database updates lock the workspace row inside a PostgreSQL transaction and reject stale versions. This MVP stores the workspace as a versioned JSON document in PostgreSQL; a normalised reporting schema is future work.

Free Render services can sleep and take time to wake. Supabase free projects have their own quotas and availability limits; review these in your dashboard. Private evidence uploads and transaction corrections remain unfinished. The first deployment contains fictional sample records and is for assessment use.

The Blueprint runs Node 24, builds with `npm ci --include=dev && npm run build`, starts with `npm start`, and follows passing checks on `main`. Do not configure multiple service replicas for the assessment deployment.
