# 📝 פרומפט 02: יצירת קבצי .env

## 🎯 מטרה

יצירת קבצי .env נפרדים לפיתוח ופרודקשן, עם הפרדה ברורה בין הסביבות.

---

## 📋 סקירה

### **מה נעשה:**
1. יצירת `.env.local` לפיתוח (עם DATABASE_URL מקומי)
2. יצירת `.env.example` כתבנית
3. יצירת טסט לבדיקת משתני סביבה
4. עדכון `.gitignore`

### **מה לא נעשה:**
- ❌ לא משנים `server/_core/env.ts` (הוא כבר תומך ב-.env)
- ❌ לא עובדים על storage (זה בפרומפט 03)
- ❌ לא משנים OAuth (זה בפרומפט 04)

---

## 🔴 שלב 1: כתיבת טסטים (Red Phase)

### **יצירת קובץ טסט:**

**קובץ:** `server/env-files.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Environment Files Setup', () => {
  const rootDir = path.resolve(__dirname, '..');
  const envLocalPath = path.join(rootDir, '.env.local');
  const envExamplePath = path.join(rootDir, '.env.example');

  it('should have .env.local file', () => {
    expect(fs.existsSync(envLocalPath)).toBe(true);
  });

  it('should have .env.example file', () => {
    expect(fs.existsSync(envExamplePath)).toBe(true);
  });

  it('.env.local should contain required development variables', () => {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    
    // Required variables
    expect(content).toContain('NODE_ENV=development');
    expect(content).toContain('PORT=');
    expect(content).toContain('DATABASE_URL=mysql://root:dev_password_2024@localhost:3306/ruach_dev');
    expect(content).toContain('GOOGLE_CLIENT_ID=');
    expect(content).toContain('GOOGLE_CLIENT_SECRET=');
    expect(content).toContain('GOOGLE_CALLBACK_URL=http://localhost:3000');
    expect(content).toContain('JWT_SECRET=');
    expect(content).toContain('ADMIN_EMAIL=');
  });

  it('.env.local should NOT contain production values', () => {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    
    // Should not have production database
    expect(content).not.toContain('tidb');
    expect(content).not.toContain('R2_ENDPOINT');
    expect(content).not.toContain('R2_ACCESS_KEY_ID');
  });

  it('.env.example should be a template without sensitive data', () => {
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    
    // Should have placeholders
    expect(content).toContain('NODE_ENV=');
    expect(content).toContain('DATABASE_URL=');
    expect(content).toContain('GOOGLE_CLIENT_ID=');
    
    // Should NOT have real values
    expect(content).not.toContain('dev_password_2024');
    expect(content).not.toContain('GOCSPX-');
  });

  it('.env.local should have valid DATABASE_URL format', () => {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
    
    expect(dbUrlMatch).toBeTruthy();
    const dbUrl = dbUrlMatch![1].trim();
    
    // Should be MySQL format
    expect(dbUrl).toMatch(/^mysql:\/\//);
    expect(dbUrl).toContain('localhost:3306');
    expect(dbUrl).toContain('ruach_dev');
  });

  it('.env.local JWT_SECRET should be at least 16 characters', () => {
    const content = fs.readFileSync(envLocalPath, 'utf-8');
    const jwtMatch = content.match(/JWT_SECRET=(.+)/);
    
    expect(jwtMatch).toBeTruthy();
    const jwtSecret = jwtMatch![1].trim();
    
    expect(jwtSecret.length).toBeGreaterThanOrEqual(16);
  });
});
```

### **הרצת הטסט (צריך להיכשל):**

```bash
pnpm test env-files.test.ts
```

**Expected Output:**
```
❌ FAIL  server/env-files.test.ts
  ✕ should have .env.local file
    Expected: true
    Received: false
```

✅ **הטסט נכשל כמצופה** - אין עדיין קבצי .env

---

## 🟢 שלב 2: שינויים בקוד (Green Phase)

### **2.1: יצירת .env.local**

**קובץ:** `.env.local` (בשורש הפרויקט)

```bash
# ═══════════════════════════════════════════════════════════
# 🔧 Development Environment Variables
# ═══════════════════════════════════════════════════════════
# This file is for LOCAL DEVELOPMENT ONLY
# DO NOT commit this file to Git!
# ═══════════════════════════════════════════════════════════

# ─── Server ────────────────────────────────────────────────
NODE_ENV=development
PORT=3000

# ─── Database ──────────────────────────────────────────────
# Local MySQL (Docker)
DATABASE_URL=mysql://root:dev_password_2024@localhost:3306/ruach_dev

# ─── Google OAuth ──────────────────────────────────────────
# Create OAuth credentials at: https://console.cloud.google.com/apis/credentials
# Authorized redirect URIs: http://localhost:3000/auth/google/callback
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# ─── JWT / Session ─────────────────────────────────────────
# Generate with: openssl rand -base64 32
JWT_SECRET=dev-secret-change-me-min-16-chars-required
ADMIN_EMAIL=admin@example.com

# ─── Storage (Local Development) ───────────────────────────
# No R2 needed for development - we'll use local filesystem
# (Will be implemented in prompt 03)

# ─── Email (Optional) ──────────────────────────────────────
# RESEND_API_KEY=re_xxx
# CONTACT_EMAIL_TO=contact@example.com

# ─── Google Maps (Optional) ────────────────────────────────
# GOOGLE_MAPS_API_KEY=AIzaSyXXX

# ─── OpenAI (Optional) ─────────────────────────────────────
# OPENAI_API_KEY=sk-xxx
```

### **2.2: יצירת .env.example**

**קובץ:** `.env.example` (בשורש הפרויקט)

```bash
# ═══════════════════════════════════════════════════════════
# 📋 Environment Variables Template
# ═══════════════════════════════════════════════════════════
# Copy this file to .env.local and fill in your values
# ═══════════════════════════════════════════════════════════

# ─── Server ────────────────────────────────────────────────
NODE_ENV=development
PORT=3000

# ─── Database ──────────────────────────────────────────────
# Development: mysql://root:password@localhost:3306/ruach_dev
# Production: mysql://user:password@host:port/database
DATABASE_URL=

# ─── Google OAuth ──────────────────────────────────────────
# Get credentials from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# ─── JWT / Session ─────────────────────────────────────────
# Generate with: openssl rand -base64 32
JWT_SECRET=
ADMIN_EMAIL=

# ─── Cloudflare R2 Storage (Production Only) ───────────────
# R2_ENDPOINT=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=
# R2_BUCKET=
# R2_PUBLIC_URL=

# ─── Email (Optional) ──────────────────────────────────────
# RESEND_API_KEY=
# CONTACT_EMAIL_TO=

# ─── Google Maps (Optional) ────────────────────────────────
# GOOGLE_MAPS_API_KEY=

# ─── OpenAI (Optional) ─────────────────────────────────────
# OPENAI_API_KEY=
```

### **2.3: עדכון .gitignore**

**קובץ:** `.gitignore`

ודא שיש את השורות הבאות (אם לא, הוסף):

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Docker
docker-compose.override.yml

# Local development
uploads/
```

### **2.4: יצירת README להסבר**

**קובץ:** `dev-environment-setup/files/.env.local.example` (עותק של .env.local)

העתק את `.env.local` ל-`dev-environment-setup/files/.env.local.example` לתיעוד.

---

## 🔵 שלב 3: Refactor והרצת טסטים

### **3.1: הרץ את הטסט החדש**

```bash
pnpm test env-files.test.ts
```

**Expected Output:**
```
✅ PASS  server/env-files.test.ts
  ✓ should have .env.local file (2ms)
  ✓ should have .env.example file (1ms)
  ✓ .env.local should contain required development variables (3ms)
  ✓ .env.local should NOT contain production values (2ms)
  ✓ .env.example should be a template without sensitive data (2ms)
  ✓ .env.local should have valid DATABASE_URL format (2ms)
  ✓ .env.local JWT_SECRET should be at least 16 characters (1ms)

Test Files  1 passed (1)
     Tests  7 passed (7)
```

### **3.2: הרץ את כל הטסטים**

```bash
pnpm test
```

**Expected Output:**
```
✅ PASS  server/env-files.test.ts
✅ PASS  server/docker-mysql.test.ts
✅ PASS  server/articles.test.ts
... (all other tests)

Test Files  X passed (X)
     Tests  Y passed (Y)
```

✅ **כל הטסטים עוברים!**

---

## ✅ שלב 4: Validation

### **בדיקות סופיות:**

```bash
# 1. בדוק שהקבצים קיימים
ls -la .env.local .env.example
# Expected: Both files exist

# 2. בדוק ש-.env.local לא ב-Git
git status
# Expected: .env.local should NOT appear (ignored)

# 3. בדוק ש-.env.example ב-Git
git status
# Expected: .env.example should appear as new file

# 4. הרץ את כל הטסטים
pnpm test
# Expected: ✅ All tests pass

# 5. בדוק TypeScript
pnpm check
# Expected: ✅ No errors

# 6. נסה להפעיל את השרת (אם יש Google OAuth credentials)
# pnpm dev
# Expected: Server starts (or fails on missing OAuth - that's OK for now)
```

---

## 🔙 Rollback Plan

אם משהו לא עובד:

### **אופציה 1: מחק את הקבצים החדשים**

```bash
# מחק .env.local (זה בטוח - הוא לא ב-Git)
rm .env.local

# מחק .env.example
rm .env.example

# מחק את הטסט
rm server/env-files.test.ts

# החזר .gitignore למצב הקודם
git checkout .gitignore
```

### **אופציה 2: Rollback מלא**

```bash
git checkout .
rm .env.local  # זה לא ב-Git אז צריך למחוק ידנית
```

---

## 📝 Commit Message

```bash
git add .env.example server/env-files.test.ts .gitignore
git commit -m "הוספתי קבצי .env לפיתוח ופרודקשן

- יצרתי .env.example כתבנית
- יצרתי .env.local לפיתוח (לא ב-Git)
- הוספתי טסטים לבדיקת משתני סביבה
- עדכנתי .gitignore
- כל הטסטים עוברים ✅

Note: .env.local לא נכלל ב-commit (ignored)"
```

---

## 🎓 מה למדנו

1. **הפרדת סביבות** - .env.local לפיתוח, .env לפרודקשן
2. **.gitignore** - מניעת commit של סודות
3. **.env.example** - תבנית למפתחים חדשים
4. **Testing** - בדיקת קיום ותוכן של קבצי תצורה

---

## 🔗 הפרומפט הבא

**03-add-local-storage.md** - תמיכה באחסון מקומי במקום R2

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0  
**סטטוס:** ✅ מוכן לשימוש
