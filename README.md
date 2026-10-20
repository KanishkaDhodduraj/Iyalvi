# IYALVI

IYALVI is a Vercel-only monorepo with separate customer storefront and admin
projects. Each project has its own frontend and Express API; both APIs use the
same MongoDB Atlas database.

## Repository structure

- `customer/frontend` - React and TanStack Start storefront
- `customer/backend` - Express and TypeScript customer API
- `admin/frontend` - React and Vite admin dashboard
- `admin/backend` - Express and TypeScript admin API
- `customer/vercel.json`, `admin/vercel.json` - Vercel multi-service routing
- `.nvmrc` - Node.js 20

Each app is an independent npm project with its own `package.json` and
`package-lock.json`. Use Node.js 20 or newer and npm.

## Local setup

Install dependencies and start each app in its own terminal:

```powershell
cd customer\backend
npm ci
npm run dev
```

```powershell
cd customer\frontend
npm ci
npm run dev
```

```powershell
cd admin\backend
npm ci
npm run dev
```

```powershell
cd admin\frontend
npm ci
npm run dev
```

The local URLs are:

- Customer API: `http://localhost:5000`
- Customer storefront: `http://localhost:8080`
- Admin API: `http://localhost:5001`
- Admin dashboard: `http://localhost:8090`

For each backend, copy its `.env.example` to `.env` in that backend directory,
then provide values locally. Never commit `.env` files. Both APIs require
`DATABASE_URL` for the same MongoDB Atlas database. Set each backend's allowed
client URL to its corresponding local frontend origin. Use a customer
`JWT_SECRET` and admin `ADMIN_JWT_SECRET` of at least 32 characters. Set
`TRUST_PROXY` to `0` locally; on Vercel set it to `1`. `COOKIE_SAME_SITE` is
optional and defaults to `lax`. `PORT` is optional; its defaults are 5000 for
the customer backend and 5001 for the admin backend. The customer backend also
supports optional `DEMO_PAYMENTS`. For local setup only, it can use
`IYALVI_ENV_FILE` as an alternate env-file path; do not set this on Vercel.

Both frontend `.env.example` files contain `VITE_API_BASE_URL`. Leave it empty
to use same-origin `/api` and `/uploads` paths; set it only when intentionally
using a separate API origin.

## Admin account

Create the first admin from `admin/backend` after setting its local database
connection and bootstrap credentials (`ADMIN_EMAIL` and `ADMIN_PASSWORD`) in
that backend's local `.env`:

```powershell
npm run create-admin
```

Initial creation is refused once an admin already exists. To create or reset
an admin locally, set the same bootstrap credentials and run:

```powershell
npm run reset-admin
```

`reset-admin` is disabled when `NODE_ENV` is `production`. The initial
`create-admin` password must be at least 12 characters. Do not put bootstrap
credentials in source control or Vercel runtime settings.

## Deploy to Vercel

Create two Vercel projects connected to this repository:

1. **Customer project:** set Root Directory to `customer`.
2. **Admin project:** set Root Directory to `admin`.

Each directory contains a `vercel.json` with two named services (`backend` and
`frontend`). Keep the service roots and framework settings from those files.
Use the npm package manager. Let Vercel detect each service's install/build
commands and output settings from its framework and package configuration; do
not replace the configured multi-service rewrites with single-output settings.
The Express backends export their app from `backend/src/app.mts`; do not add a
custom `app.listen()` Vercel entrypoint.
The admin SPA has a frontend-service fallback to `index.html`; API and upload
requests are routed to the backend before the frontend catch-all.

Configure environment variables in each Vercel project (Production and any
other environments you deploy):

- Customer backend: required `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`;
  optional `GOOGLE_CLIENT_ID`, `DEMO_PAYMENTS`, `COOKIE_SAME_SITE`, and
  `PORT`. Set `TRUST_PROXY=1` on Vercel.
- Customer frontend: optionally `VITE_API_BASE_URL` (leave it empty for
  same-origin).
- Admin backend: required `DATABASE_URL`, `ADMIN_JWT_SECRET`,
  `ADMIN_CLIENT_URL`; optionally `COOKIE_SAME_SITE` and `PORT`. Set
  `TRUST_PROXY=1` on Vercel.
- Admin frontend: optionally `VITE_API_BASE_URL` (leave it empty for
  same-origin).

Vercel sets `NODE_ENV`; it is not a required project variable. Add all secret
values through Vercel's environment-variable UI or CLI, never to this
repository. Both backend services must use the same Atlas database URL.
`COOKIE_SAME_SITE` defaults to `lax`; leave it unset when frontend and API are
served from the same Vercel project origin. Do not configure a cookie domain
such as `.vercel.app`.

The frontend's canonical origin is not known until the first deployment:

1. Deploy both projects once.
2. Set customer `CLIENT_URL` to the customer frontend's deployed origin, and
   admin `ADMIN_CLIENT_URL` to the admin frontend's deployed origin. Use only
   the origin (scheme and host), without a trailing slash or path.
3. Redeploy the respective projects so CORS and cookie settings use those
   origins.

Create the initial admin against the shared database from a trusted local
machine with the production `DATABASE_URL` and one-time `ADMIN_EMAIL` and
`ADMIN_PASSWORD` supplied securely to `npm run create-admin`. Do not configure
the bootstrap credentials as persistent Vercel variables.

Function settings such as `maxDuration` are declared inside each backend
service's `functions` configuration in the same file. The promotion-expiry
cron is not enabled because there is currently no matching backend endpoint.

## Deployment limits

- Admin image uploads require cloud storage configuration. In production,
  upload requests return `503 Image storage not configured` until a storage
  provider is configured. Product creation without images remains available.
- The Hobby plan supports a daily cron schedule, not more frequent runs.
- A real Atlas connection and deployed Vercel build require project credentials
  and environment values; local checks use placeholder settings only.
