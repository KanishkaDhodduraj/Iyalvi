# IYALVI

IYALVI is a Vercel-only monorepo for the customer storefront and admin panel.
Each has an independent frontend and Express API; both APIs use the same
MongoDB Atlas database.

## Structure

- `customer/frontend` - React and TanStack Start storefront
- `customer/backend` - Express and TypeScript API
- `admin/frontend` - React and Vite dashboard
- `admin/backend` - Express and TypeScript API
- `.nvmrc` - Node.js 20

Each app has its own npm manifest and lockfile. See the deployment guide for
local setup and Vercel configuration.
