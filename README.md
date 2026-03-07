# Vinaroda

Vinaroda is a full-stack Next.js e-commerce platform with:
- Storefront (home, shop, filters, product details)
- Customer features (auth, cart, checkout, wishlist, order history)
- Admin portal (KPIs, categories, products, order status pipeline)
- PostgreSQL + Prisma data layer
- NextAuth credentials authentication with admin/customer roles
- Local image uploads via multipart API (`/api/upload`)

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
