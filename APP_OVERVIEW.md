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
- **רינדור: SSR מלא / Full SSR.** כל route מגיע לדפדפן כ-HTML מרונדר מלא עם הנתונים
  שלו, ואז הקליינט עושה `hydrateRoot`. עץ ה-React + הספקים מחולצים ל-factory יחיד
  `client/src/AppTree.tsx` (queryClient/trpcClient/wouter `ssrPath` מוזרקים),
  שמרונדר זהה בשרת ובקליינט. שתי נקודות כניסה: `client/src/entry-client.tsx`
  (`hydrateRoot`, או `createRoot` כ-fallback אם ה-#root ריק) ו-
  `client/src/entry-server.tsx` (`render(url,{fetch})` עם `react-dom/static`
  `prerenderToNodeStream` — תומך ב-Suspense/lazy, שלא כמו `renderToString`).
  הרכבת ה-HTML + ה-fetch מודע-ה-session: `server/_core/ssr.ts`
  (`renderHtml` + `makeSsrFetch`). ה-render מחובר ב-`server/_core/vite.ts`
  (dev: `vite.ssrLoadModule`; prod: import של `dist/server/entry-server.js`).
- `client/src/` — `App.tsx` (routing), `AppTree.tsx`, `entry-{client,server}.tsx`,
  `routes/ssrData.ts` (מפת prefetch per-route), `pages/`, `components/`, `hooks/`
  (`useDocumentTitle`), `contexts/`, `lib/` (tRPC client + `trpcClient.ts` factory).
- `server/_core/` — env, trpc setup, vite/SSR middleware (`vite.ts`), `ssr.ts`,
  oauth, entry (`index.ts`).
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
  `trigramExplanation`/`interpretation` + `line1..line6` — טקסט קו משתנה לכל קו, קו 1=תחתון), `ichingTrigramText`
  (`trigramKey` + `name`/`element`/`attr` overrides + `description` HTML),
  `ichingIntro` (singleton: מאמר + תוויות). המבנה הקבוע (lookup/גליפים/מנוע ההטלה)
  **אינו** ב-DB — הוא ב-`shared/iching/`. השמות הם override: ריק ב-DB → נופלים לברירת
  המחדל המנוקדת מ-shared (`effectiveHexName`/`effectiveTrigram` ב-`client/src/pages/iching/model.ts`).
- **I Ching — מכסת AI:** `ichingAiUsage` (`userId`, `monthYear` "YYYY-MM", `usageCount`,
  unique על `(userId, monthYear)`). שומר **רק מונה** שימושי פירוש-AI חודשיים — לעולם לא
  שאלה/תשובה. גישה אטומית (upsert) ב-`server/db/ichingUsage.ts`.

## Endpoints / API
tRPC routers תחת `server/routers/` (articles, auth, categories, newsletter, contact, …),
מוגשים תחת `/api` דרך Vite middleware. _TODO: לרשום את הפרוצדורות העיקריות per router._
- **`iching`** — `getContent` (ציבורי: מחזיר hexagrams+trigrams+intro ממוזגים);
  `interpret` (`protectedProcedure`: פירוש AI אישי דרך ספק נבחר — DeepSeek כברירת מחדל,
  Gemini כ-fallback (`ICHING_AI_PROVIDER`), עם retry/backoff על 429/5xx; בודק מכסה חודשית →
  `FORBIDDEN`/403 בחריגה, מקדם מונה רק בהצלחה, אדמין פטור; השאלה נשלחת רק בלחיצה מפורשת
  ואינה נשמרת); `upsertHexagram`/`upsertTrigram`/`updateIntro` (`adminProcedure` בלבד).
  ה-AI מוזרק דרך `RouterDeps` (`generateIchingInterpretation`, `ichingAiMonthlyLimit`).

## Workflow / Lifecycle
זרימת בקשת SSR (GET ל-route, לא `/api`/נכס): השרת בונה `makeSsrFetch(req)` (מעביר
את ה-Cookie ל-loopback `127.0.0.1:<port>`) → `entry-server.render(url)` מבצע
**prefetch** של ה-tRPC procedures לפי `routes/ssrData.ts` (גלובלי:
`settings`/`categories`/`auth.me`; לפי route: iching/article/category…) לתוך
QueryClient → `prerenderToNodeStream` מרנדר את `AppTree` עם הנתונים →
`dehydrate`+superjson → `window.__APP_STATE__` → השרת מזריק `appHtml` ל-`#root`,
state, ו-`<head>` per-route (seo.ts) → HTML מלא. הקליינט: `hydrate` של ה-cache
מ-`__APP_STATE__` ואז `hydrateRoot` — בלי בקשת רשת כפולה. **SEO/head:** המקור
היחיד ל-head ב-SSR הוא `server/seo.ts` (`applySeoToHtml`, per-route כולל
`/iching`); `react-helmet-async` הוסר (לא תואם React 19 prerender) ועדכון title
בניווט SPA עובר ל-`useDocumentTitle`. ה-head כולל גם OG+Twitter card, `og:image`
ברירת-מחדל (`/og-image.jpg`) ו-`article:*`/`og:site_name` למאמרים, ונתונים מובנים
schema.org JSON-LD (`server/jsonld.ts`: Organization+WebSite בדפים כלליים,
BlogPosting+BreadcrumbList במאמר). **נקודות-קצה לסורקים:** `server/sitemap.ts`
(`/sitemap.xml`), `server/robots.ts` (`/robots.txt`), `server/rss.ts` (`/rss.xml`,
מפורסם ב-head כ-`rel="alternate"`) — כולם נרשמים ב-`_core/startup/seo-routes.ts`.
נכסים עם hash תחת `/assets/` מוגשים `immutable` לשנה (`_core/vite.ts`). **Build/Run:** `pnpm build`
(client+manifest → ssr bundle → server bundle) → `pnpm start` (`node dist/index.js`).

זרימת מאמר: יצירה/עריכה ע"י אדמין (עורך TipTap) → סטטוס טיוטה/פורסם → הצגה בדף הבית
(חיפוש/סינון/פופולריים) → עמוד מאמר (תוכן, צמדות, תגובות, likes, שיתוף).
_TODO: לאמת את מעברי הסטטוס מול הקוד._

זרימת קריאת אי-צ'ינג: מאמר מבוא → שאלה (state בלבד, לא נשמרת) → הטלת 3 מטבעות ×6
בצד הלקוח (`cast()` ב-`shared/iching`) → הקסגרמה ראשית (+נגזרת אם נפלו קווים
משתנים) נבנית מלמטה למעלה → בחירה אינטראקטיבית (הקסגרמה ראשית/נגזרת/טריגרמה) →
חלון פירוט יחיד עם הפירוש **הממוזג**: מבנה מ-`shared/iching` + טקסט מה-DB.
**פירוש AI אישי:** משתמש מחובר יכול ללחוץ "קבל פירוש AI מותאם אישית" (`IChingAiPanel`,
**מעל** הפירוש הסטטי) → הלקוח מזריק את שם+טקסט ההקסגרמות הסטטיות + השאלה + טקסט הקווים שבאמת נפלו כמשתנים (`line1..6`) ל-`iching.interpret`
→ השרת בונה פרומפט Tao Oracle (`server/ichingAi.ts`) ושולח לספק ה-AI (DeepSeek כברירת מחדל) → תשובת Markdown מוצגת
בתיבה ייעודית. מכסה חודשית הניתנת להגדרה (`ICHING_AI_MONTHLY_LIMIT`, ברירת מחדל 5), נספרת
ב-`ichingAiUsage`. הערך נחשף ללקוח דרך `iching.getContent` כדי שהפרומפטים למשתמש יציגו את
המספר המעודכן ולא מספר מקובע. אורח רואה כפתור חסום עם הזמנה להתחברות. השאלה/התשובה לעולם אינן נשמרות.

## היסטוריית שינויים משמעותיים / Significant change history
| תאריך / Date | שינוי / Change | קבצים עיקריים / Key files |
|---|---|---|
| 2026-06-20 | Initial overview created (dev-kit bootstrap) | — |
| 2026-06-20 | Vitest now loads `.env.local` so env-validated app modules no longer crash test files; repaired failing suite | `vitest.setup.ts`, `vitest.config.ts` |
| 2026-06-20 | Added behavioural test layer for tRPC routers via a fake-deps harness over `createAppRouter` (coverage 2%→7%, 0→146 passing) | `server/test-helpers/trpc.ts`, `server/routers/*.router.test.ts` |
| 2026-06-21 | I Ching reading feature: pure structure+casting engine, text tables + router, public reading page with coin/build animations, admin editor. (Content: trigrams + intro + hexagrams 1/2/11 seeded; 8 Gemini + remaining 53 pending source text.) | `shared/iching/`, `drizzle/schema.ts` (`iching*`), `server/db/iching.ts`, `server/routers/iching.router.ts`, `client/src/pages/IChingReading.tsx`, `client/src/pages/AdminIChing.tsx`, `client/src/pages/iching/`, `client/src/components/iching/`, `scripts/seed-iching.ts` |
| 2026-06-21 | I Ching: `/iching` linked from site nav/footer/admin menu; editable hexagram/trigram names (DB override, fallback to shared defaults) | `client/src/components/SiteLayout.tsx`, `drizzle/schema.ts` (`name`/`element`/`attr`), `client/src/pages/iching/model.ts`, `IChingReading.tsx`, `AdminIChing.tsx` |
| 2026-06-21 | **Full SSR migration** (SPA→SSR): injectable `AppTree`, `entry-client`/`entry-server` (`prerenderToNodeStream`), Vite SSR build (manifest + `--ssr` bundle), server render in dev+prod, per-route tRPC prefetch+dehydrate→`__APP_STATE__`→hydrate (auth-aware via cookie-forwarding loopback fetch), seo.ts as single SSR head source (+`/iching`), react-helmet-async removed (→`useDocumentTitle`), deterministic dark theme, Railway loopback origin | `client/src/AppTree.tsx`, `client/src/entry-{client,server}.tsx`, `client/src/lib/trpcClient.ts`, `client/src/routes/ssrData.ts`, `client/src/hooks/useDocumentTitle.ts`, `server/_core/ssr.ts`, `server/_core/vite.ts`, `server/_core/startup/{frontend,server}.ts`, `server/seo.ts`, `vite.config.ts`, `package.json`, `client/index.html` |
| 2026-06-22 | **I Ching personal AI interpretation** (Gemini): protected `iching.interpret` endpoint with monthly quota (`ICHING_AI_MONTHLY_LIMIT`=5, admins exempt, count-on-success, 403 on exceed), `ichingAiUsage` counter table (stores only a count — never the question/answer), Tao-Oracle prompt builder, client context-injection + `IChingAiPanel` shown above the static interpretation. New env: `GEMINI_API_KEY`, `GEMINI_MODEL` (`gemini-2.5-flash`), `ICHING_AI_MONTHLY_LIMIT`. Built on a clean base — the old Forge/Manus LLM infra (`server/_core/llm.ts`, `imageGeneration.ts`, `voiceTranscription.ts`, `map.ts`, `dataApi.ts`, `client Map.tsx`, `FORGE_*` env) was removed. | `server/ichingAi.ts`, `server/db/ichingUsage.ts`, `server/routers/iching.router.ts`, `server/routers/{context,index}.ts`, `drizzle/schema.ts` + `0011_*.sql`, `client/src/components/iching/IChingAiPanel.tsx`, `client/src/pages/iching/model.ts`, `client/src/pages/IChingReading.tsx`, `server/_core/env.ts` |
| 2026-06-22 | **I Ching AI → DeepSeek provider**: replaced the default AI provider with DeepSeek (OpenAI-compatible API via `fetch`, no new dep) because the Gemini free tier surfaced intermittent 503/429 (overload/rate-limit, *not* content blocks) as generic errors. `generateIchingInterpretation` is now provider-agnostic (`ICHING_AI_PROVIDER` = `deepseek` default \| `gemini`), with `withRetry` exponential backoff on transient 429/5xx/network. `temperature: 0.7` — DeepSeek's Hebrew degrades to gibberish at 1.3. New env: `ICHING_AI_PROVIDER`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` (`deepseek-chat`), `DEEPSEEK_BASE_URL`. `buildIchingPrompt` unchanged. | `server/ichingAi.ts`, `server/_core/env.ts`, `.env.example` |
| 2026-06-22 | **Configurable monthly AI quota end-to-end**: `iching.getContent` now returns `aiMonthlyLimit` (from `ICHING_AI_MONTHLY_LIMIT`) so the client renders the configured number instead of a hardcoded "5" in both user prompts (guest login invite + quota-exceeded message). The limit was already env-driven server-side; this wires it through to the UI. README env table documents the var. | `server/routers/iching.router.ts`, `client/src/pages/iching/model.ts`, `client/src/pages/IChingReading.tsx`, `client/src/components/iching/IChingAiPanel.tsx`, `README.md`, `.env.example` |
| 2026-06-22 | **I Ching AI error UX + tunable temperature**: `IChingAiPanel` now shows a "נסה שוב" retry button on transient errors and, after 3 consecutive non-quota failures, an apology that points to the static interpretations and confirms the quota was not consumed (count-on-success); quota errors are excluded from the failure counter. `DEEPSEEK_TEMPERATURE` env (default 0.7) makes Hebrew creativity tunable without a code change. Added unit tests for provider selection + `withRetry` (retry-on-503, no-retry-on-400, give-up-after-3, empty/missing-key, Gemini routing). | `client/src/components/iching/IChingAiPanel.tsx`, `server/ichingAi.ts`, `server/ichingAi.provider.test.ts`, `server/_core/env.ts`, `.env.example` |
| 2026-06-22 | **I Ching per-line changing-lines → AI prompt**: replaced the single free-text `changingLinesNote` column with six per-line columns `line1..line6` (line 1 = bottom), edited as numbered fields in the admin. `buildAiContext` collects only the lines that actually fell as changing (`reading.changing`) **and** have text; `iching.interpret` forwards them; `buildIchingPrompt` injects a "קו N: …" block. Closes a latent gap — the old note was never sent to the model. Migration `0012` (added columns + dropped `changingLinesNote`); applied to dev DB via docker exec. | `drizzle/schema.ts` + `0012_*.sql`, `server/ichingAi.ts`, `server/routers/iching.router.ts`, `client/src/pages/iching/model.ts`, `client/src/pages/AdminIChing.tsx` (+ tests) |
| 2026-06-23 | **Fix: og:image missing in link previews after SSR migration**. `resolveArticleSeo`/`resolveCategorySeo` passed `coverImage` straight into `og:image`; locally-stored covers are relative (`/uploads/…`), which OG crawlers (WhatsApp/Facebook/Twitter) can't fetch — so shared links lost their image. New `toAbsoluteImageUrl` helper prefixes relative paths with `SITE_URL_PRODUCTION` and passes absolute (R2/CDN) URLs through unchanged. Pre-SSR this worked because the tag was injected client-side. | `server/seo.ts`, `server/seo.test.ts` |
| 2026-06-23 | **ponytail-audit cleanup, follow-up** (materiality pass on held items): kept `getPublicUrl` (material — `upload.ts`→`uploadBuffer`→R2 branch→`getPublicUrl`); deleted immaterial test-only storage fns `uploadFile`/`getPresignedUrl`/`downloadFile`/`getStorageMode` and `relationFor` (prod uses `relationForEffective`), trimmed their tests (222→217). Removing the first two dropped the last users of `@aws-sdk/lib-storage` + `@aws-sdk/s3-request-presigner` → uninstalled. Storage surface is now just `uploadBuffer`/`getPublicUrl`/`isR2Configured`. | `server/storage.ts`, `server/local-storage.test.ts`, `server/dev-environment-integration.test.ts`, `shared/iching/trigrams.ts`, `shared/iching/iching.test.ts`, `package.json` |
| 2026-06-23 | **ponytail-audit cleanup** (over-engineering sweep, no behaviour change): deleted dead client files (`ComponentShowcase`, `AIChatBox`, `ManusDialog`, `hooks/domain/`, `lib/categories.ts`, ~1.9k lines); removed dead server symbols (duplicate `adminProcedure`, `ENV` alias, dead cookie helpers, vestigial `HtmlParts.head`, storage `createS3Client`/`getBucket`/`storagePut`); **collapsed the single-impl `AuthService` interface + `setAuthService` strategy to a plain `getSession(req)` function**; dropped dead shared symbols (`HttpError`, `COOKIE_NAME`, `ONE_YEAR_MS`, `AXIOS_TIMEOUT_MS`, `TRIGRAM_BY_KEY`) + redundant docs (`PROJECT_SUMMARY.md`, `ORGANIZATION_SUMMARY.md`); uninstalled unused deps `axios`, `react-helmet-async`, `add`, and the redundant `pnpm` devDep. ~2.4k lines, -4 deps; all 222 tests still green. Spec: `feature-prompts/ponytail-cleanup/`. | `server/_core/auth/{types,session,index}.ts`, `server/_core/{context,trpc,cookies,env,ssr,systemRouter}.ts`, `server/storage.ts`, `shared/{const,types}.ts`, `shared/iching/trigrams.ts`, `client/src/const.ts`, `package.json` |
| 2026-06-26 | **SEO promotion round 2** (`feature-prompts/seo-promotion/`): updated site description (+יהדות, +I Ching); default share image (`client/public/og-image.jpg`, 1200×630) for the homepage + Twitter card tags; **schema.org JSON-LD** (`server/jsonld.ts`: Organization+WebSite on generic pages, BlogPosting+BreadcrumbList on articles, with `</script>` breakout escaping); `og:site_name`/`og:image:alt`/`article:*` meta on articles; **`/rss.xml`** feed (`server/rss.ts`, head autodiscovery); `/iching` added to `sitemap.xml`; hashed `/assets/*` now cached `immutable` for 1y (`_core/vite.ts`, was 4h). Off-site owner tasks tracked in `docs/SEO_CHECKLIST.md`. +28 tests (210→238). | `server/jsonld.ts`(+test), `server/seo.ts`(+test), `server/rss.ts`(+test), `server/sitemap.ts`(+test), `server/_core/vite.ts`(+test), `server/_core/startup/seo-routes.ts`, `client/public/og-image.jpg`, `docs/SEO_CHECKLIST.md` |
