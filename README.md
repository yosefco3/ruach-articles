# Ruach Articles

A full-stack article publishing platform with a React frontend and an Express + tRPC backend, backed by a MySQL database.

---

## Prerequisites

- **Node.js** (v18+)
- **pnpm** — install with `npm install -g pnpm`
- **Docker** & **Docker Compose** (for the MySQL database)

---

## 1. Clone & Install

```bash
git clone git@github.com:yosefco3/ruach-articles.git
cd ruach-articles
pnpm install
```

---

## 2. Environment Variables

Copy the example env file and fill in the values:

```bash
cp .env.example .env.local
```

Edit `.env.local` and provide values for (see `.env.example` for the full list):

| Variable                 | Description                                   |
| ------------------------ | --------------------------------------------- |
| `DATABASE_URL`           | MySQL connection string                       |
| `GOOGLE_CLIENT_ID`       | Google OAuth client ID (optional, for auth)   |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth client secret (optional)         |
| `RESEND_API_KEY`         | Resend API key (optional, for email)          |
| `OPENAI_API_KEY`         | OpenAI key (optional, for AI features)        |

> **Note:** For local development the app can run without the optional keys; the corresponding features will simply be disabled.

---

## 3. Start the Database

```bash
docker compose up -d
```

This starts a MySQL container as defined in `docker-compose.yml`.

---

## 4. Run Database Migrations

```bash
pnpm drizzle-kit push
```

This syncs the Drizzle schema (`drizzle/schema.ts`) to the database.

To seed sample data (optional):

```bash
node server/seed.mjs
```

---

## 5. Run the Development Server

The project uses a single Vite-based dev server that serves both the frontend and the backend API:

```bash
npx pnpm dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5173/api (Express + tRPC, served through Vite's middleware mode)

> The backend is loaded via Vite's `server/index.ts` entry point (configured in `vite.config.ts`). There is no separate server process to start.

---

## 6. Running Tests

```bash
pnpm test
```

Tests are executed with Vitest (`vitest.config.ts`).

---

## Project Structure

```
ruach-articles/
├── client/               # React frontend (Vite + TypeScript)
│   ├── index.html        # HTML entry point
│   └── src/
│       ├── App.tsx       # Root component & routing
│       ├── main.tsx      # React entry point
│       ├── pages/        # Page components
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks
│       ├── contexts/     # React context providers
│       └── lib/          # Utilities & tRPC client
├── server/               # Express + tRPC backend
│   ├── _core/            # Core server setup (env, trpc, vite, oauth, etc.)
│   ├── routers/          # tRPC routers (articles, auth, categories, etc.)
│   ├── db.ts             # Drizzle ORM database client
│   ├── upload.ts         # File upload handling
│   ├── contact.ts        # Contact form logic
│   └── newsletterEmail.ts
├── shared/               # Shared types & constants
├── drizzle/              # Database migrations & schema
├── docker-compose.yml    # MySQL container definition
├── vite.config.ts        # Vite config (dev server + API middleware)
├── drizzle.config.ts     # Drizzle Kit config
└── vitest.config.ts      # Test config
```

---

## Useful Commands

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `pnpm dev`             | Start the dev server (front + back) |
| `pnpm build`           | Production build                    |
| `pnpm test`            | Run tests                           |
| `pnpm drizzle-kit push`| Push schema changes to the database |
| `docker compose up -d` | Start MySQL database                |
| `docker compose down`  | Stop MySQL database                 |

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Express, tRPC, Drizzle ORM
- **Database:** MySQL (Docker)
- **Auth:** Google OAuth (optional)
- **Email:** Resend (optional)
- **AI:** OpenAI (optional)