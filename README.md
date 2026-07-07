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
Copy `.env.example` and fill in real values. Required:
- `DATABASE_URL` — PostgreSQL connection string.
- `NEXTAUTH_URL` — the site's public URL (e.g. `https://yourdomain.com`) in production.
- `NEXTAUTH_SECRET` — a strong, unique secret. Generate one:
  - `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - or `openssl rand -base64 32`

The app refuses to start in production if `NEXTAUTH_SECRET` is missing or left as
the placeholder value.

## Production deployment
This is a Next.js (App Router) + Prisma app and **requires a Node.js runtime**.
It runs on a Node host (VPS, container, or a Node-capable platform) — **not** on
PHP/shared hosting.

1. Provision PostgreSQL and set the env vars above on the host.
2. Install and build:
   ```bash
   npm ci
   npm run prisma:generate
   npm run build
   ```
3. Apply database migrations (production-safe, does not reset data):
   ```bash
   npx prisma migrate deploy
   ```
4. (Optional) Seed initial data: `npm run prisma:seed`
5. Start the server (behind a reverse proxy / process manager such as PM2):
   ```bash
   npm run start        # or: pm2 start "npm run start" --name vianaroda
   ```
6. Put Nginx (or the host's proxy) in front to terminate TLS and forward to the
   app's port (default 3000).

Note: uploaded product images are written to `public/uploads` on the local
filesystem, which works on a persistent VPS/disk but not on ephemeral/serverless
hosts. For multi-instance or serverless deployments, switch uploads to object
storage (S3/R2/Blob).
