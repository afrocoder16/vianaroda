# Vinaroda

Vinaroda is a full-stack Next.js e-commerce platform with:
- Storefront (Amazon-style home, search, shop filters, product details, support)
- Customer features (auth, cart, checkout, account hub, wishlist, order history, tracking)
- Admin portal (KPIs, categories, products, suppliers, imports, order status pipeline)
- PostgreSQL + Prisma data layer
- NextAuth credentials authentication with admin/customer roles
- Local image uploads via multipart API (`/api/upload`)
- Dropshipping workflow fields for supplier assignment, markup control, fulfillment, and tracking

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth
- Vitest (unit tests)

## Scripts
- `npm run dev` - Start dev server
- `npm run build` - Build production app
- `npm run start` - Run production server
- `npm run lint` - Lint code
- `npm run test` - Run Vitest tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run dev migrations
- `npm run prisma:seed` - Seed sample data

## Payments (demo mode)
This build does **not** process real payments. Checkout records orders as
`PENDING` (unpaid) and the UI clearly labels the flow as a demo — no card is
charged and no card data is collected. To take real money, integrate a payment
provider (e.g. Stripe) and only set an order to `PAID` after a confirmed charge.

## Environment variables
Copy `.env.example` and fill in real values (see the file for details). Summary:
- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL. On Supabase, `DATABASE_URL` is the
  pooled string (port 6543, `?pgbouncer=true`) and `DIRECT_URL` is the direct
  string (port 5432, used for migrations). Locally, set both to the same URL.
- `NEXTAUTH_URL` — the site's public URL in production.
- `NEXTAUTH_SECRET` — a strong, unique secret (`openssl rand -base64 32`).
  The app refuses to start in production if this is missing or the placeholder.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` —
  enable Supabase Storage for uploaded/imported images. If unset, images fall
  back to the local `public/uploads` folder (fine for local dev only).

## Production deployment (Vercel + Supabase)
This is a Next.js (App Router) + Prisma app and requires a Node.js runtime. The
recommended free hosting is **Vercel** (app) + **Supabase** (Postgres + image
storage). Every push to GitHub auto-builds and deploys.

**1. Supabase (database + storage)**
- Create a Supabase project. From *Project Settings → Database*, copy the
  **pooled** connection string (Transaction, port 6543 — add `?pgbouncer=true`)
  into `DATABASE_URL`, and the **direct** connection string (port 5432) into
  `DIRECT_URL`.
- In *Storage*, create a **public** bucket named `product-images`.
- From *Project Settings → API*, copy the project URL into `SUPABASE_URL` and the
  **service_role** key into `SUPABASE_SERVICE_ROLE_KEY`.

**2. Apply the schema to Supabase** (run once, locally, pointed at Supabase):
```bash
DIRECT_URL="<supabase-direct-url>" npx prisma migrate deploy
# optional: seed demo data
DIRECT_URL="<supabase-direct-url>" DATABASE_URL="<supabase-pooled-url>" npm run prisma:seed
```

**3. Vercel (app)**
- Import the GitHub repo into Vercel (Framework preset: Next.js).
- Add all env vars from step 1 plus `NEXTAUTH_URL` (the Vercel URL) and
  `NEXTAUTH_SECRET`.
- Deploy. Vercel runs `next build` (which runs `prisma generate` via the
  postinstall/Prisma integration) and serves the app.

> Uploaded images must use Supabase Storage on Vercel — the Vercel filesystem is
> ephemeral, so the `public/uploads` fallback would lose images between deploys.

### Alternative: self-hosted Node (VPS)
On a persistent Node host you can skip Supabase Storage and use the local
`public/uploads` folder. Run `npm ci && npm run build && npx prisma migrate
deploy`, then `pm2 start "npm run start"` behind Nginx for TLS.
