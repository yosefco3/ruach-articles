# 🤖 הקשר מלא על פרויקט רוּחַ - עבור AI

## 🎯 מטרה

מסמך זה מספק לך (AI/Cline) את כל ההקשר הדרוש להקמת סביבת פיתוח לפרויקט רוּחַ.

## ⚠️ חשוב מאוד - NPX בלבד!

**במחשב זה, npm ו-pnpm לא עובדים כראוי!**

**תמיד השתמש ב-`npx pnpm` במקום `pnpm` בכל הפקודות!**

ראה: [IMPORTANT-NPX-ONLY.md](IMPORTANT-NPX-ONLY.md) לפרטים מלאים.

---

## 📊 סקירת הפרויקט

### **שם:** רוּחַ (Ruach)
### **תיאור:** פלטפורמת מאמרים ברוחניות, פילוסופיה וריפוי
### **טכנולוגיות:**
- **Frontend:** React 19 + Vite + TypeScript
- **Backend:** Express + tRPC + Drizzle ORM
- **Database:** MySQL/TiDB (פרודקשן), MySQL (פיתוח)
- **Storage:** Cloudflare R2 (פרודקשן), Local FS (פיתוח)
- **Auth:** Google OAuth + Manus OAuth
- **Package Manager:** pnpm

---

## 🏗️ מבנה הפרויקט

```
ruach-articles/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # דפי האפליקציה
│   │   ├── components/    # קומפוננטות
│   │   └── lib/           # utilities
│   └── index.html
│
├── server/                # Express backend
│   ├── _core/            # core functionality
│   │   ├── index.ts      # entry point
│   │   ├── env.ts        # environment validation
│   │   ├── oauth.ts      # OAuth setup
│   │   └── trpc.ts       # tRPC setup
│   ├── db.ts             # database functions
│   ├── storage.ts        # R2 storage
│   ├── routers.ts        # tRPC routers
│   └── *.test.ts         # Vitest tests
│
├── drizzle/              # Database schema
│   ├── schema.ts         # Drizzle schema
│   └── migrations/       # SQL migrations
│
├── shared/               # Shared types
│   └── types.ts
│
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## 🔧 טכנולוגיות מפורטות

### **Frontend:**
- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching
- **tRPC Client** - Type-safe API calls
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **Wouter** - Routing

### **Backend:**
- **Express** - HTTP server
- **tRPC** - Type-safe API
- **Drizzle ORM** - Database ORM
- **Passport** - OAuth authentication
- **Zod** - Schema validation
- **Vitest** - Testing framework

### **Database:**
- **Production:** TiDB (MySQL-compatible cloud)
- **Development:** MySQL 8.0 (Docker)
- **Schema:** Drizzle ORM
- **Migrations:** Drizzle Kit

### **Storage:**
- **Production:** Cloudflare R2 (S3-compatible)
- **Development:** Local filesystem
- **SDK:** AWS SDK v3

---

## 📁 קבצי תצורה חשובים

### **package.json:**
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx watch server/_core/index.ts",
    "build": "vite build && esbuild server/_core/index.ts ...",
    "start": "NODE_ENV=production node dist/index.js",
    "test": "vitest run",
    "check": "tsc --noEmit",
    "db:push": "drizzle-kit generate && drizzle-kit migrate"
  }
}
```

### **server/_core/env.ts:**
```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  ADMIN_EMAIL: z.string().email(),
  R2_ENDPOINT: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_URL: z.string().min(1),
  RESEND_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  CONTACT_EMAIL_TO: z.string().optional(),
});
```

### **server/db.ts:**
- משתמש ב-`process.env.DATABASE_URL` ישירות
- יוצר connection ל-MySQL דרך Drizzle
- מספק פונקציות CRUD לכל הטבלאות

### **server/storage.ts:**
- משתמש ב-AWS SDK v3 ל-R2
- יוצר S3Client עם credentials מ-env
- מספק: `uploadFile()`, `uploadBuffer()`, `downloadFile()`, `getPublicUrl()`

---

## 🎯 המשימה: הקמת סביבת פיתוח

### **מצב נוכחי:**
- ✅ הפרויקט עובד בפרודקשן
- ✅ יש טסטים (Vitest)
- ✅ Git repository מוגדר
- ❌ אין סביבת פיתוח מקומית
- ❌ אין הפרדת branches
- ❌ אין תמיכה באחסון מקומי

### **מה צריך:**
1. **MySQL מקומי** - Docker container
2. **קבצי .env** - הפרדה בין פיתוח לפרודקשן
3. **אחסון מקומי** - תמיכה ב-local filesystem במקום R2
4. **OAuth מקומי** - הגדרות ל-localhost
5. **הגנה על פרודקשן** - branch protection, .gitignore

---

## 🧪 עקרון TDD

כל פרומפט עוקב אחרי:

### **🔴 Red Phase:**
כתוב טסטים **רק** לפיצ'ר הספציפי של הפרומפט הזה.
הטסטים צריכים להיכשל כי הקוד עדיין לא קיים.

### **🟢 Green Phase:**
כתוב את הקוד המינימלי שגורם לטסטים לעבור.

### **🔵 Refactor Phase:**
שפר את הקוד, הרץ שוב את כל הטסטים.

### **✅ Validation:**
בסוף כל פרומפט:
```bash
pnpm test
# Expected: ✅ ALL tests pass (100%)
```

**חשוב:** לא יהיו טסטים נכשלים בסוף פרומפט!
כל פרומפט מוסיף רק את הטסטים שהוא גם מממש.

---

## 📋 רשימת הפרומפטים

1. **01-setup-docker-mysql.md** - הקמת MySQL ב-Docker
2. **02-create-env-files.md** - יצירת .env.local ו-.env.example
3. **03-add-local-storage.md** - תמיכה באחסון מקומי
4. **04-update-oauth-config.md** - הגדרת OAuth ל-localhost
5. **05-test-dev-environment.md** - בדיקת הסביבה המלאה
6. **06-fix-production-safety.md** - הגנה על פרודקשן

---

## 🔐 משתני סביבה

### **פרודקשן (.env):**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:pass@tidb-host:4000/ruach_prod
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=https://ruach.example.com/auth/google/callback
JWT_SECRET=xxx
ADMIN_EMAIL=admin@example.com
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=ruach-files
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### **פיתוח (.env.local):**
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/ruach_dev
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
JWT_SECRET=dev-secret-min-16-chars
ADMIN_EMAIL=admin@example.com
# Local storage - no R2 needed
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads
```

---

## 🗄️ מבנה Database

### **טבלאות עיקריות:**
- `users` - משתמשים (OAuth)
- `articles` - מאמרים
- `comments` - תגובות
- `categories` - קטגוריות
- `attachments` - קבצים מצורפים
- `likes` - לייקים
- `guestPosts` - פוסטים של אורחים
- `newsletterSubscribers` - מנויים לניוזלטר
- `siteSettings` - הגדרות אתר
- `aboutPage` - דף אודות
- `featuredArticle` - מאמר מומלץ
- `userProfiles` - פרופילי משתמשים

### **Schema Location:**
`drizzle/schema.ts` - Drizzle ORM schema

---

## 🧪 טסטים קיימים

### **מיקום:** `server/*.test.ts`

### **דוגמאות:**
- `articles.test.ts` - טסטים למאמרים
- `contact.test.ts` - טסטים לטופס יצירת קשר
- `newsletter-management.test.ts` - טסטים לניוזלטר
- `categories-newsletter.test.ts` - טסטים לקטגוריות
- `featured-article.test.ts` - טסטים למאמר מומלץ

### **הרצה:**
```bash
pnpm test                    # כל הטסטים
pnpm test articles.test.ts   # טסט ספציפי
```

---

## 🚀 פקודות שימושיות

```bash
# פיתוח
pnpm dev                # הפעל שרת פיתוח
pnpm test               # הרץ טסטים
pnpm check              # בדוק TypeScript
pnpm build              # בנה לפרודקשן

# Database
pnpm db:push            # הרץ migrations

# Docker
docker-compose up -d    # הפעל MySQL
docker-compose down     # עצור MySQL
docker ps               # בדוק containers
```

---

## 🎓 עקרונות חשובים

### **1. TDD - Test-Driven Development**
כל שינוי מתחיל בטסט:
- 🔴 כתוב טסט שנכשל
- 🟢 כתוב קוד שעובר
- 🔵 שפר את הקוד

### **2. הפרדת סביבות**
- **פיתוח:** MySQL מקומי, אחסון מקומי, OAuth עם localhost
- **פרודקשן:** TiDB, R2 storage, OAuth עם domain

### **3. בטיחות**
- אף שינוי לא עולה לפרודקשן בלי בדיקה
- כל פרומפט כולל rollback plan
- טסטים מגנים מפני regression

### **4. Git Workflow**
```
main (production) ← השרת מושך מכאן בלבד
  ↑
  merge אחרי בדיקה מלאה
  ↑
development ← כל הפיתוח כאן
```

---

## 🔗 קישורים חשובים

- **GitHub:** `https://github.com/yosefco3/ruach-articles`
- **מדריכי המפתח:** `../FOR-DEVELOPER/`
- **פרומפטים:** `./01-setup-docker-mysql.md` ואילך

---

## 💡 טיפים לביצוע

1. **קרא את כל הפרומפט לפני שמתחיל** - הבן את המטרה
2. **עקוב אחרי TDD בדיוק** - Red → Green → Refactor
3. **הרץ טסטים אחרי כל שינוי** - ודא שהכל עובד
4. **תעד מה עשית** - commit messages ברורים
5. **שמור rollback plan** - תמיד יש דרך חזרה

---

## 🆘 אם משהו לא עובד

1. **בדוק את הלוגים** - `pnpm dev` או `docker-compose logs`
2. **הרץ טסטים** - `pnpm test` לראות מה נשבר
3. **בדוק .env.local** - ודא שכל המשתנים קיימים
4. **Rollback** - `git checkout [file]` או `git reset --hard`
5. **שאל את המפתח** - אם באמת תקוע

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0  
**מטרה:** הקמת סביבת פיתוח מקומית לפרויקט רוּחַ
