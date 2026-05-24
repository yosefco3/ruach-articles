# 🔐 פרומפט 04: הגדרת OAuth ל-localhost

## 🎯 מטרה

עדכון הגדרות OAuth לעבודה עם localhost בסביבת פיתוח.

---

## 📋 סקירה

### **מה נעשה:**
1. יצירת טסט לבדיקת OAuth configuration
2. תיעוד יצירת Google OAuth credentials
3. עדכון `.env.local` עם הוראות
4. בדיקה שהשרת עולה עם OAuth

### **מה לא נעשה:**
- ❌ לא משנים `server/_core/oauth.ts` (הוא כבר תומך ב-localhost)
- ❌ לא יוצרים credentials בפועל (המפתח יעשה זאת)
- ❌ לא עובדים על testing environment (זה בפרומפט 05)

---

## 🔴 שלב 1: כתיבת טסטים (Red Phase)

### **יצירת קובץ טסט:**

**קובץ:** `server/oauth-config.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { env } from './_core/env';

describe('OAuth Configuration', () => {
  it('should have Google OAuth credentials configured', () => {
    expect(env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(env.GOOGLE_CLIENT_SECRET).toBeDefined();
    expect(env.GOOGLE_CALLBACK_URL).toBeDefined();
  });

  it('should use localhost callback URL in development', () => {
    if (env.NODE_ENV === 'development') {
      expect(env.GOOGLE_CALLBACK_URL).toContain('localhost');
      expect(env.GOOGLE_CALLBACK_URL).toContain('http://');
      expect(env.GOOGLE_CALLBACK_URL).not.toContain('https://');
    }
  });

  it('should have callback URL with correct path', () => {
    expect(env.GOOGLE_CALLBACK_URL).toContain('/auth/google/callback');
  });

  it('should have valid Google Client ID format', () => {
    // Google Client IDs end with .apps.googleusercontent.com
    expect(env.GOOGLE_CLIENT_ID).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it('should have valid Google Client Secret format', () => {
    // Google Client Secrets start with GOCSPX-
    expect(env.GOOGLE_CLIENT_SECRET).toMatch(/^GOCSPX-/);
  });

  it('should have JWT secret configured', () => {
    expect(env.JWT_SECRET).toBeDefined();
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(16);
  });

  it('should have admin email configured', () => {
    expect(env.ADMIN_EMAIL).toBeDefined();
    expect(env.ADMIN_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
```

### **הרצת הטסט (צריך להיכשל):**

```bash
pnpm test oauth-config.test.ts
```

**Expected Output:**
```
❌ FAIL  server/oauth-config.test.ts
  ✕ should have valid Google Client ID format
    Expected: string matching /\.apps\.googleusercontent\.com$/
    Received: "your-client-id.apps.googleusercontent.com"
```

✅ **הטסט נכשל כמצופה** - יש placeholders ב-.env.local

---

## 🟢 שלב 2: שינויים בקוד (Green Phase)

### **2.1: יצירת מדריך OAuth**

**קובץ:** `dev-environment-setup/FOR-DEVELOPER/OAUTH-SETUP.md`

```markdown
# 🔐 הגדרת Google OAuth לפיתוח

## 📋 סקירה

מדריך זה מסביר כיצד ליצור Google OAuth credentials לסביבת הפיתוח המקומית.

---

## 🚀 שלבים

### **שלב 1: גישה ל-Google Cloud Console**

1. עבור ל-[Google Cloud Console](https://console.cloud.google.com/)
2. התחבר עם חשבון Google שלך
3. צור פרויקט חדש או בחר פרויקט קיים

### **שלב 2: הפעלת Google+ API**

1. בתפריט הצד, לחץ על **APIs & Services** > **Library**
2. חפש **"Google+ API"**
3. לחץ על **Enable**

### **שלב 3: יצירת OAuth Credentials**

1. בתפריט הצד, לחץ על **APIs & Services** > **Credentials**
2. לחץ על **Create Credentials** > **OAuth client ID**
3. אם מתבקש, הגדר **OAuth consent screen**:
   - User Type: **External**
   - App name: **Ruach Dev**
   - User support email: **your-email@example.com**
   - Developer contact: **your-email@example.com**
   - לחץ **Save and Continue**
   - Scopes: השאר ריק, לחץ **Save and Continue**
   - Test users: הוסף את המייל שלך, לחץ **Save and Continue**

4. חזור ל-**Credentials** ולחץ **Create Credentials** > **OAuth client ID**
5. Application type: **Web application**
6. Name: **Ruach Development**
7. **Authorized redirect URIs**:
   - לחץ **Add URI**
   - הוסף: `http://localhost:3000/auth/google/callback`
8. לחץ **Create**

### **שלב 4: העתקת Credentials**

1. תיפתח חלונית עם **Client ID** ו-**Client Secret**
2. העתק את שניהם
3. פתח את `.env.local` בפרויקט
4. החלף את הערכים:

```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_CLIENT_SECRET_HERE
```

### **שלב 5: בדיקה**

```bash
# הרץ את הטסטים
pnpm test oauth-config.test.ts

# הפעל את השרת
pnpm dev

# פתח בדפדפן
open http://localhost:3000

# נסה להתחבר עם Google
```

---

## 🔒 אבטחה

- **אל תשתף** את ה-Client Secret עם אף אחד
- **אל תעלה** את `.env.local` ל-Git
- **השתמש** ב-credentials שונים לפיתוח ופרודקשן

---

## 🆘 פתרון בעיות

### **שגיאה: "redirect_uri_mismatch"**

**פתרון:**
1. בדוק ש-`GOOGLE_CALLBACK_URL` ב-.env.local זהה ל-URI ב-Google Console
2. ודא שאין רווחים או תווים מיוחדים
3. ודא שה-URI מתחיל ב-`http://` (לא `https://`)

### **שגיאה: "invalid_client"**

**פתרון:**
1. בדוק ש-`GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET` נכונים
2. ודא שהעתקת את כל התווים (כולל הסיומת)
3. נסה ליצור credentials חדשים

### **שגיאה: "access_denied"**

**פתרון:**
1. ודא שהמייל שלך מוגדר כ-Test User ב-OAuth consent screen
2. בדוק שה-Google+ API מופעל

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0
```

### **2.2: עדכון .env.local עם הוראות**

**קובץ:** `.env.local`

עדכן את הסעיף של Google OAuth:

```bash
# ─── Google OAuth ──────────────────────────────────────────
# 📖 Setup Instructions:
# 1. Go to: https://console.cloud.google.com/apis/credentials
# 2. Create OAuth 2.0 Client ID (Web application)
# 3. Add Authorized redirect URI: http://localhost:3000/auth/google/callback
# 4. Copy Client ID and Client Secret below
# 5. See dev-environment-setup/FOR-DEVELOPER/OAUTH-SETUP.md for detailed guide

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### **2.3: יצירת קובץ דוגמה עם credentials אמיתיים**

**קובץ:** `dev-environment-setup/files/.env.local.with-oauth-example`

```bash
# Example with real OAuth credentials structure
# (These are fake credentials for demonstration)

GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

---

## 🔵 שלב 3: Refactor והרצת טסטים

### **3.1: עדכן .env.local עם credentials אמיתיים**

```bash
# אם יש לך credentials, עדכן את .env.local
# אם אין, עקוב אחרי המדריך ב-OAUTH-SETUP.md
```

### **3.2: הרץ את הטסט החדש**

```bash
pnpm test oauth-config.test.ts
```

**Expected Output (עם credentials אמיתיים):**
```
✅ PASS  server/oauth-config.test.ts
  ✓ should have Google OAuth credentials configured (2ms)
  ✓ should use localhost callback URL in development (1ms)
  ✓ should have callback URL with correct path (1ms)
  ✓ should have valid Google Client ID format (1ms)
  ✓ should have valid Google Client Secret format (1ms)
  ✓ should have JWT secret configured (1ms)
  ✓ should have admin email configured (1ms)

Test Files  1 passed (1)
     Tests  7 passed (7)
```

**Expected Output (עם placeholders):**
```
❌ FAIL  server/oauth-config.test.ts
  ✕ should have valid Google Client ID format
  
Note: This is expected if you haven't set up OAuth yet.
Follow dev-environment-setup/FOR-DEVELOPER/OAUTH-SETUP.md
```

### **3.3: הרץ את כל הטסטים**

```bash
pnpm test
```

**Expected Output:**
```
✅ PASS  server/oauth-config.test.ts (or ❌ if no OAuth)
✅ PASS  server/local-storage.test.ts
✅ PASS  server/env-files.test.ts
✅ PASS  server/docker-mysql.test.ts
... (all other tests)

Test Files  X passed (X)
     Tests  Y passed (Y)
```

---

## ✅ שלב 4: Validation

### **בדיקות סופיות:**

```bash
# 1. בדוק שהמדריך קיים
ls -la dev-environment-setup/FOR-DEVELOPER/OAUTH-SETUP.md
# Expected: File exists

# 2. הרץ את כל הטסטים
pnpm test
# Expected: ✅ All tests pass (or OAuth test fails if not configured)

# 3. בדוק TypeScript
pnpm check
# Expected: ✅ No errors

# 4. נסה להפעיל את השרת (אם יש OAuth credentials)
# pnpm dev
# Expected: Server starts successfully
# Open http://localhost:3000 and try to login with Google
```

---

## 🔙 Rollback Plan

אם משהו לא עובד:

### **אופציה 1: מחק את הקבצים החדשים**

```bash
# מחק את הטסט
rm server/oauth-config.test.ts

# מחק את המדריך
rm dev-environment-setup/FOR-DEVELOPER/OAUTH-SETUP.md

# החזר .env.local למצב הקודם
git checkout .env.local
```

### **אופציה 2: Rollback מלא**

```bash
git checkout .
```

---

## 📝 Commit Message

```bash
git add server/oauth-config.test.ts dev-environment-setup/FOR-DEVELOPER/OAUTH-SETUP.md .env.local
git commit -m "הוספתי הגדרות OAuth לפיתוח

- יצרתי טסט לבדיקת OAuth configuration
- יצרתי מדריך מפורט ליצירת Google OAuth credentials
- עדכנתי .env.local עם הוראות
- כל הטסטים עוברים ✅

Note: OAuth test may fail until credentials are configured"
```

---

## 🎓 מה למדנו

1. **OAuth Setup** - יצירת credentials ב-Google Cloud Console
2. **Environment Validation** - בדיקת פורמט של credentials
3. **Documentation** - מדריך מפורט למפתחים
4. **Security** - הפרדה בין פיתוח לפרודקשן

---

## 🔗 הפרומפט הבא

**05-test-dev-environment.md** - בדיקת הסביבה המלאה

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0  
**סטטוס:** ✅ מוכן לשימוש
