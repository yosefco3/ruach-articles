# 🚀 מדריך הקמת סביבת פיתוח - רוּחַ

## 📋 סקירה כללית

מדריך זה מכיל את כל המידע והפרומפטים הדרושים להקמת סביבת פיתוח מקומית לפרויקט רוּחַ, תוך שמירה על בטיחות סביבת הפרודקשן.

---

## 🎯 מטרות

1. **הפרדה מלאה** בין סביבת פיתוח לפרודקשן
2. **בטיחות** - שינויים ב-GitHub לא ישברו את הפרודקשן
3. **עצמאות** - עבודה מקומית ללא תלות בשרת
4. **TDD** - כל שינוי מגובה בטסטים

---

## 📁 מבנה התיעוד

```
dev-environment-setup/
│
├── README.md                          # הקובץ הזה
│
├── FOR-DEVELOPER/                     # 📘 מדריכים עבור המפתח
│   ├── 01-GIT-WORKFLOW.md            # מדריך Git/GitHub מלא
│   ├── 02-DAILY-WORKFLOW.md          # תהליך עבודה יומיומי
│   ├── 03-DEPLOYMENT.md              # איך לעדכן פרודקשן
│   └── 04-TROUBLESHOOTING.md         # פתרון בעיות נפוצות
│
├── FOR-AI/                            # 🤖 פרומפטים עבור Cline/AI
│   ├── CONTEXT.md                    # הקשר מלא על הפרויקט
│   ├── 01-setup-docker-mysql.md      # פרומפט: הקמת MySQL
│   ├── 02-create-env-files.md        # פרומפט: יצירת .env
│   ├── 03-add-local-storage.md       # פרומפט: אחסון מקומי
│   ├── 04-update-oauth-config.md     # פרומפט: עדכון OAuth
│   ├── 05-test-dev-environment.md    # פרומפט: בדיקת הסביבה
│   └── 06-fix-production-safety.md   # פרומפט: הגנה על פרודקשן
│
└── files/                             # 📦 קבצים מוכנים לשימוש
    ├── docker-compose.yml
    ├── .env.local.example
    ├── .env.production.example
    ├── .gitignore.additions
    └── setup.sh
```

---

## 🚦 איך להתחיל?

### **למפתח (אתה):**

1. **קרא את המדריכים ב-`FOR-DEVELOPER/`:**
   - התחל עם `01-GIT-WORKFLOW.md` - זה המדריך המרכזי שלך
   - המשך ל-`02-DAILY-WORKFLOW.md` לתהליך יומיומי
   - `03-DEPLOYMENT.md` לעדכון פרודקשן

2. **הכן את סביבת העבודה:**
   - צור branch `development` (הוראות ב-Git Workflow)
   - הגדר את השרת למשוך רק מ-`main`

### **ל-AI (Cline):**

1. **העתק את `FOR-AI/CONTEXT.md`** - תן לו הקשר מלא
2. **הפעל את הפרומפטים לפי הסדר:**
   - `01-setup-docker-mysql.md` - הקמת בסיס נתונים
   - `02-create-env-files.md` - יצירת קבצי הגדרות
   - `03-add-local-storage.md` - תמיכה באחסון מקומי
   - `04-update-oauth-config.md` - הגדרת OAuth
   - `05-test-dev-environment.md` - בדיקת הסביבה
   - `06-fix-production-safety.md` - הגנה על פרודקשן

---

## 🎓 עקרונות מנחים

### **1. TDD (Test-Driven Development)**
כל שינוי בקוד מתחיל בכתיבת טסטים:
- 🔴 Red: כתוב טסט שנכשל
- 🟢 Green: כתוב קוד שעובר
- 🔵 Refactor: שפר את הקוד

### **2. Branch Strategy**
```
main (production) ← השרת מושך מכאן בלבד
  ↑
  merge אחרי בדיקה מלאה
  ↑
development ← כל הפיתוח כאן
```

### **3. הפרדת סביבות**
- **פיתוח:** MySQL מקומי, אחסון מקומי, OAuth עם localhost
- **פרודקשן:** MySQL בשרת, R2 storage, OAuth עם domain

### **4. בטיחות**
- אף שינוי לא עולה לפרודקשן בלי בדיקה
- כל פרומפט כולל rollback plan
- טסטים מגנים מפני regression

---

## 📊 סטטוס הפרויקט

### **טכנולוגיות:**
- Frontend: React 19 + Vite + TypeScript
- Backend: Express + tRPC + Drizzle ORM
- Database: MySQL/TiDB
- Storage: Cloudflare R2 (S3-compatible)
- Auth: Google OAuth + Manus OAuth

### **מה כבר קיים:**
- ✅ פרויקט עובד בפרודקשן
- ✅ טסטים קיימים (Vitest)
- ✅ Git repository מוגדר
- ✅ CI/CD דרך GitHub

### **מה חסר:**
- ❌ סביבת פיתוח מקומית
- ❌ הפרדת branches (development/main)
- ❌ תמיכה באחסון מקומי
- ❌ הגדרות .env לפיתוח

---

## 🔗 קישורים מהירים

- **🔒 Branch Protection:** `BRANCH-PROTECTION.md` ← **קרא קודם!**
- **Git Workflow:** `FOR-DEVELOPER/01-GIT-WORKFLOW.md`
- **התחלה מהירה:** `FOR-DEVELOPER/02-DAILY-WORKFLOW.md`
- **פרומפט ראשון:** `FOR-AI/01-setup-docker-mysql.md`
- **קבצי תצורה:** `files/`

---

## 💡 טיפים

1. **קרא את כל המדריכים לפני שמתחילים** - זה חוסך זמן
2. **הפעל את הפרומפטים לפי הסדר** - יש תלויות ביניהם
3. **הרץ טסטים אחרי כל שינוי** - `pnpm test`
4. **שמור commits קטנים** - קל יותר ל-rollback
5. **תעד שינויים** - עזור לעצמך בעתיד

---

## 🆘 עזרה

אם נתקעת:
1. בדוק את `FOR-DEVELOPER/04-TROUBLESHOOTING.md`
2. הרץ `pnpm test` לראות מה נשבר
3. בדוק את הלוגים: `pnpm dev`
4. rollback: `git checkout [file]`

---

## 📝 רישיון

MIT - ראה LICENSE בשורש הפרויקט

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0  
**מחבר:** Cline AI + Yosef
