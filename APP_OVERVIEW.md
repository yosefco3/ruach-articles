# APP_OVERVIEW — רוּחַ / Ruach Articles

> עדכון אחרון / Last updated: 2026-06-21
> מסמך חי. עדכן אותו אחרי כל שינוי שנוגע בפיצ'רים/מודלים/endpoints/workflow/ארכיטקטורה.

## מה זה / What it is
פלטפורמת מאמרים עברית RTL בנושא רוחניות, פילוסופיה וריפוי. כוללת ניהול מאמרים
(עורך TipTap), קטגוריות ותגיות, מערכת תגובות, likes, חיפוש בזמן אמת, ניוזלטר,
והרשאות אדמין. Full-stack: React frontend + Express/tRPC backend מעל MySQL.
בנוסף: **קריאת אִי צִ׳ינְג** (`/iching`) — דף ציבורי שבו מבקר כותב שאלה (שאינה נשמרת),
מטיל 3 מטבעות 6 פעמים בצד הלקוח, ורואה הקסגרמה ראשית (+נגזרת אם יש קווים משתנים)
עם פירוש; אדמין עורך את הטקסטים ב-`/admin/iching`.

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
- `shared/iching/` — **מבנה ומנוע הטלה טהורים** (פורט מאב-טיפוס HTML): 8 טריגרמות,
  64 הקסגרמות, טבלת King Wen (`HEX_LOOKUP`), ומנוע 3-המטבעות (`cast()`, RNG מוזרק).
  קוד טהור משותף ל-client+server; הטקסט הערוך בלבד חי ב-DB.
- `client/src/pages/iching/` — מודולי לוגיקה טהורים לדף הקריאה (`model.ts` מיזוג
  מבנה+טקסט, `reveal.ts` תזמון האנימציה) + טסטים colocated.
- `drizzle/` — schema + migrations (`drizzle/schema.ts`).

## מודלים / Data models
מוגדרים ב-`drizzle/schema.ts` (Drizzle). ישויות מרכזיות: מאמרים, קטגוריות, תגיות,
תגובות, משתמשים/אדמין, ניוזלטר. _TODO: למפות שדות ויחסים מדויקים מ-schema.ts._
- **I Ching (טקסט ערוך בלבד):** `ichingHexagramText` (number 1..64 + `name` override +
  `trigramExplanation`/`interpretation`/`changingLinesNote`), `ichingTrigramText`
  (`trigramKey` + `name`/`element`/`attr` overrides + `description` HTML),
  `ichingIntro` (singleton: מאמר + תוויות). המבנה הקבוע (lookup/גליפים/מנוע ההטלה)
  **אינו** ב-DB — הוא ב-`shared/iching/`. השמות הם override: ריק ב-DB → נופלים לברירת
  המחדל המנוקדת מ-shared (`effectiveHexName`/`effectiveTrigram` ב-`client/src/pages/iching/model.ts`).

## Endpoints / API
tRPC routers תחת `server/routers/` (articles, auth, categories, newsletter, contact, …),
מוגשים תחת `/api` דרך Vite middleware. _TODO: לרשום את הפרוצדורות העיקריות per router._
- **`iching`** — `getContent` (ציבורי: מחזיר hexagrams+trigrams+intro ממוזגים);
  `upsertHexagram`/`upsertTrigram`/`updateIntro` (`adminProcedure` בלבד). השאלה של
  המשתמש לעולם אינה נשלחת לשרת — אין פרוצדורה שמקבלת אותה.

## Workflow / Lifecycle
זרימת מאמר: יצירה/עריכה ע"י אדמין (עורך TipTap) → סטטוס טיוטה/פורסם → הצגה בדף הבית
(חיפוש/סינון/פופולריים) → עמוד מאמר (תוכן, צמדות, תגובות, likes, שיתוף).
_TODO: לאמת את מעברי הסטטוס מול הקוד._

זרימת קריאת אי-צ'ינג: מאמר מבוא → שאלה (state בלבד, לא נשמרת) → הטלת 3 מטבעות ×6
בצד הלקוח (`cast()` ב-`shared/iching`) → הקסגרמה ראשית (+נגזרת אם נפלו קווים
משתנים) נבנית מלמטה למעלה → בחירה אינטראקטיבית (הקסגרמה ראשית/נגזרת/טריגרמה) →
חלון פירוט יחיד עם הפירוש **הממוזג**: מבנה מ-`shared/iching` + טקסט מה-DB.

## היסטוריית שינויים משמעותיים / Significant change history
| תאריך / Date | שינוי / Change | קבצים עיקריים / Key files |
|---|---|---|
| 2026-06-20 | Initial overview created (dev-kit bootstrap) | — |
| 2026-06-20 | Vitest now loads `.env.local` so env-validated app modules no longer crash test files; repaired failing suite | `vitest.setup.ts`, `vitest.config.ts` |
| 2026-06-20 | Added behavioural test layer for tRPC routers via a fake-deps harness over `createAppRouter` (coverage 2%→7%, 0→146 passing) | `server/test-helpers/trpc.ts`, `server/routers/*.router.test.ts` |
| 2026-06-21 | I Ching reading feature: pure structure+casting engine, text tables + router, public reading page with coin/build animations, admin editor. (Content: trigrams + intro + hexagrams 1/2/11 seeded; 8 Gemini + remaining 53 pending source text.) | `shared/iching/`, `drizzle/schema.ts` (`iching*`), `server/db/iching.ts`, `server/routers/iching.router.ts`, `client/src/pages/IChingReading.tsx`, `client/src/pages/AdminIChing.tsx`, `client/src/pages/iching/`, `client/src/components/iching/`, `scripts/seed-iching.ts` |
| 2026-06-21 | I Ching: `/iching` linked from site nav/footer/admin menu; editable hexagram/trigram names (DB override, fallback to shared defaults) | `client/src/components/SiteLayout.tsx`, `drizzle/schema.ts` (`name`/`element`/`attr`), `client/src/pages/iching/model.ts`, `IChingReading.tsx`, `AdminIChing.tsx` |
