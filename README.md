# Expense Tracker App

A full-stack expense & income tracking application built with Next.js 14 App Router, TypeScript, TailwindCSS, Drizzle ORM (PostgreSQL/Neon), Clerk authentication, and Recharts.

## Features
- User authentication (Clerk)
- Add/Edit/Delete expenses & incomes
- Recurring transactions (daily/weekly/monthly)
- Category tagging & color coding
- Dashboard metrics & charts
- Category budget limits & alerts
- Export to CSV & PDF
- Responsive design + Dark mode
- Seed script for sample data

## Tech Stack
Frontend: Next.js 14 (App Router), React 18, TailwindCSS, Framer Motion
Backend: Next.js API Routes
Database: PostgreSQL (Neon) via Drizzle ORM
Auth: Clerk
Charts: Recharts
Export: csv-writer, pdfkit

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Env Vars
Create `.env` based on `.env.example`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
EXCHANGE_RATES_API_KEY=
NEXT_CACHE_DIR=C:/temp/next-cache
```

### 3. Database (Neon)
- Create a Neon project & database.
- Obtain the connection string (include `?sslmode=require`).
- Run migrations:
```bash
npm run drizzle:generate
npm run drizzle:migrate
```

### 4. Seed Data
```bash
npm run seed
```

### 5. Run Dev Server
```bash
npm run dev
```
Visit http://localhost:3000

## Deployment
- Push repo to GitHub
- Create Vercel project (import repo)
- Set environment variables in Vercel dashboard
- Neon: ensure connection pooling enabled
- Redeploy

## Scripts
- `dev` - start dev server
- `build` - production build
- `start` - run production server
- `drizzle:generate` - generate migrations
- `drizzle:migrate` - run migrations
- `seed` - seed sample data

## Stretch Goals (Planned)
- PWA offline support
- Multi-currency with exchange rates API
- Monthly email reports

## License
MIT

## Windows / OneDrive Note
If the project lives inside a OneDrive synced folder you may encounter `EINVAL: invalid argument, readlink` errors when Next.js dev server cleans `.next`. To mitigate:
- Move the project outside OneDrive OR
- Define `NEXT_CACHE_DIR` pointing to a non-synced folder (e.g. `C:/temp/next-cache`) and create that directory.
- Run `npm run clean` before `npm run dev` if stale artifacts persist.
