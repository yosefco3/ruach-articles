# Ruach Articles

A full-stack article publishing platform: a React (Vite + SSR) frontend and an
Express + tRPC backend, backed by a MySQL database. Includes Google OAuth, image
uploads (Cloudflare R2 in production), a newsletter/contact flow, and an
AI-powered I Ching interpretation feature.

---

## Prerequisites

- **Node.js** v20.6+ (the dev/seed scripts use the built-in `--env-file` flag)
- **pnpm** — install with `npm install -g pnpm`
- **Docker** & **Docker Compose** (for the MySQL database)

---

## 1. Clone & install

```bash
git clone git@github.com:yosefco3/ruach-articles.git
cd ruach-articles
pnpm install
```

---

## 2. Environment variables

Copy the template and fill in your values:

```bash
cp .env.example .env.local
```

The app reads `.env.local`. See `.env.example` for the full, annotated list; the
most important variables:

| Variable                                | Required | Description                                              |
| --------------------------------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`                          | yes      | MySQL connection string                                  |
| `PORT`                                  | no       | HTTP port (default `3000`)                               |
| `JWT_SECRET`                            | yes\*    | Session/JWT signing secret (`openssl rand -base64 32`)   |
| `ADMIN_EMAIL`                           | no       | Email granted admin access                               |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | no | Google OAuth login                |
| `RESEND_API_KEY` / `CONTACT_EMAIL_TO`   | no       | Transactional email (newsletter / contact form)          |
| `R2_*`                                  | prod     | Cloudflare R2 storage (production uploads)               |
| `ICHING_AI_PROVIDER`                    | no       | I Ching AI provider: `deepseek` (default) or `gemini`    |
| `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` / `DEEPSEEK_TEMPERATURE` | no | DeepSeek (OpenAI-compatible) config         |
| `GEMINI_API_KEY` / `GEMINI_MODEL`       | no       | Gemini config (fallback provider)                        |
| `ICHING_AI_MONTHLY_LIMIT`               | no       | Monthly AI-interpretation quota per registered user (default `5`) |

\* Required for auth to work; the app boots without it but login will fail.

> **Note:** For local development the optional keys can be left blank — the
> corresponding features (auth, email, AI interpretation) are simply disabled.

---

## 3. Start the database

```bash
docker compose up -d
```

This starts the MySQL container defined in `docker-compose.yml`.

---

## 4. Run database migrations

```bash
pnpm drizzle-kit push
```

This syncs the Drizzle schema (`drizzle/schema.ts`) to the database.

Optional sample data:

```bash
node server/seed.mjs      # general content
pnpm seed:iching          # I Ching hexagram data
```

---

## 5. Run the development server

A single Express server hosts both the API and the frontend, with Vite running in
middleware mode (HMR + SSR). There is no separate frontend process.

```bash
pnpm dev          # or: pnpm dev:watch  (restarts on server file changes)
```

- **App**: http://localhost:3000
- **API**: http://localhost:3000/api (Express + tRPC)

The entry point is `server/_core/index.ts`.

---

## 6. Running tests

Tests need the MySQL container running (`docker compose up -d`):

```bash
pnpm test         # Vitest
```

---

## Project structure

```
ruach-articles/
├── client/               # React frontend (Vite + TypeScript, SSR)
│   ├── index.html        # HTML entry point
│   └── src/
│       ├── entry-client.tsx / entry-server.tsx  # CSR + SSR entries
│       ├── App.tsx       # Root component
│       ├── routes/       # Route definitions
│       ├── pages/        # Page components
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks
│       ├── contexts/     # React context providers
│       └── lib/          # Utilities & tRPC client
├── server/               # Express + tRPC backend
│   ├── _core/            # Server bootstrap (index, env, trpc, vite, oauth)
│   ├── routers/          # tRPC routers (articles, auth, categories, …)
│   ├── db.ts             # Drizzle ORM database client
│   ├── upload.ts         # File upload handling
│   ├── contact.ts        # Contact form logic
│   └── newsletterEmail.ts
├── shared/               # Types & constants shared by client and server
├── drizzle/              # Database schema & migrations
├── scripts/              # Seed & maintenance scripts
├── docker-compose.yml    # MySQL container definition
├── vite.config.ts        # Vite config (dev middleware + SSR)
├── drizzle.config.ts     # Drizzle Kit config
└── vitest.config.ts      # Test config
```

---

## Useful commands

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `pnpm dev`              | Start the dev server (API + frontend)    |
| `pnpm dev:watch`        | Same, restarting on server file changes  |
| `pnpm build`            | Production build (client + SSR + server) |
| `pnpm start`            | Run the production build                 |
| `pnpm test`             | Run tests (needs MySQL up)               |
| `pnpm check`            | Type-check with `tsc --noEmit`           |
| `pnpm format`           | Format with Prettier                     |
| `pnpm drizzle-kit push` | Push schema changes to the database      |
| `docker compose up -d`  | Start MySQL                              |
| `docker compose down`   | Stop MySQL                              |

---

## Tech stack

- **Frontend:** React, TypeScript, Vite (SSR), Tailwind CSS, shadcn/ui
- **Backend:** Express, tRPC, Drizzle ORM
- **Database:** MySQL (Docker)
- **Auth:** Google OAuth + JWT (optional)
- **Storage:** Cloudflare R2 (production uploads)
- **Email:** Resend (optional)
- **AI:** DeepSeek (default) or Gemini — I Ching interpretation (optional)
