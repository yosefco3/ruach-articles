# APP_OVERVIEW — רוּחַ / Ruach Articles

> עדכון אחרון / Last updated: 2026-06-20
> מסמך חי. עדכן אותו אחרי כל שינוי שנוגע בפיצ'רים/מודלים/endpoints/workflow/ארכיטקטורה.

## מה זה / What it is
פלטפורמת מאמרים עברית RTL בנושא רוחניות, פילוסופיה וריפוי. כוללת ניהול מאמרים
(עורך TipTap), קטגוריות ותגיות, מערכת תגובות, likes, חיפוש בזמן אמת, ניוזלטר,
והרשאות אדמין. Full-stack: React frontend + Express/tRPC backend מעל MySQL.

## סטאק / Stack
- **Frontend:** React, TypeScript, Vite, Tailwind, shadcn/ui (`client/`)
- **Backend:** Express + tRPC, Drizzle ORM (`server/`)
- **DB:** MySQL (Docker, `docker-compose.yml`)
- **Shared types/constants:** `shared/`
- אינטגרציות אופציונליות: Google OAuth (auth), Resend (email), OpenAI (AI)
- הרצה / Run: `pnpm dev` (Vite serves front + `/api` in middleware mode, port 5173)
- DB: `docker compose up -d` ואז `pnpm drizzle-kit push`
- טסטים / Tests: `pnpm test` (Vitest; דורש את MySQL רץ)

## ארכיטקטורה / Architecture
- `client/src/` — `App.tsx` (routing), `pages/`, `components/`, `hooks/`, `contexts/`,
  `lib/` (tRPC client + utils).
- `server/_core/` — env, trpc setup, vite middleware, oauth, entry (`index.ts`).
- `server/routers/` — tRPC routers (articles, auth, categories, …).
- `server/` — `db.ts` (Drizzle client), `upload.ts`, `contact.ts`, `newsletterEmail.ts`.
- `shared/` — טיפוסים וקבועים משותפים בין client ל-server.
- `drizzle/` — schema + migrations (`drizzle/schema.ts`).

## מודלים / Data models
מוגדרים ב-`drizzle/schema.ts` (Drizzle). ישויות מרכזיות: מאמרים, קטגוריות, תגיות,
תגובות, משתמשים/אדמין, ניוזלטר. _TODO: למפות שדות ויחסים מדויקים מ-schema.ts._

## Endpoints / API
tRPC routers תחת `server/routers/` (articles, auth, categories, newsletter, contact, …),
מוגשים תחת `/api` דרך Vite middleware. _TODO: לרשום את הפרוצדורות העיקריות per router._

## Workflow / Lifecycle
זרימת מאמר: יצירה/עריכה ע"י אדמין (עורך TipTap) → סטטוס טיוטה/פורסם → הצגה בדף הבית
(חיפוש/סינון/פופולריים) → עמוד מאמר (תוכן, צמדות, תגובות, likes, שיתוף).
_TODO: לאמת את מעברי הסטטוס מול הקוד._

## היסטוריית שינויים משמעותיים / Significant change history
| תאריך / Date | שינוי / Change | קבצים עיקריים / Key files |
|---|---|---|
| 2026-06-20 | Initial overview created (dev-kit bootstrap) | — |
| 2026-06-20 | Vitest now loads `.env.local` so env-validated app modules no longer crash test files; repaired failing suite | `vitest.setup.ts`, `vitest.config.ts` |
| 2026-06-20 | Added behavioural test layer for tRPC routers via a fake-deps harness over `createAppRouter` (coverage 2%→7%, 0→146 passing) | `server/test-helpers/trpc.ts`, `server/routers/*.router.test.ts` |
