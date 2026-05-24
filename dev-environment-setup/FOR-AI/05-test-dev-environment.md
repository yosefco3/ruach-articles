# ✅ פרומפט 05: בדיקת סביבת הפיתוח

## 🎯 מטרה

בדיקה מקיפה של כל סביבת הפיתוח - Docker, Database, Storage, OAuth והשרת.

---

## 📋 סקירה

### **מה נעשה:**
1. יצירת טסט אינטגרציה מקיף
2. בדיקת כל הרכיבים ביחד
3. יצירת סקריפט בדיקה אוטומטי
4. תיעוד תהליך הבדיקה

### **מה לא נעשה:**
- ❌ לא משנים קוד קיים
- ❌ לא עובדים על production safety (זה בפרומפט 06)
- ❌ לא מוסיפים features חדשים

---

## 🔴 שלב 1: כתיבת טסטים (Red Phase)

### **יצירת קובץ טסט אינטגרציה:**

**קובץ:** `server/dev-environment-integration.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { env, isR2Configured } from './_core/env';
import { getStorageMode, uploadBuffer, downloadFile } from './storage';

describe('Development Environment Integration', () => {
  describe('Docker MySQL', () => {
    it('should connect to MySQL container', async () => {
      const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'dev_password_2024',
      });

      expect(connection).toBeDefined();
      await connection.end();
    });

    it('should have ruach_dev database', async () => {
      const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'dev_password_2024',
      });

      const [databases] = await connection.query('SHOW DATABASES');
      const dbNames = (databases as any[]).map((db) => db.Database);

      expect(dbNames).toContain('ruach_dev');
      await connection.end();
    });
  });

  describe('Environment Variables', () => {
    it('should have all required variables', () => {
      expect(env.NODE_ENV).toBe('development');
      expect(env.DATABASE_URL).toContain('localhost:3306');
      expect(env.DATABASE_URL).toContain('ruach_dev');
      expect(env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(env.GOOGLE_CLIENT_SECRET).toBeDefined();
      expect(env.GOOGLE_CALLBACK_URL).toContain('localhost');
      expect(env.JWT_SECRET).toBeDefined();
      expect(env.ADMIN_EMAIL).toBeDefined();
    });

    it('should NOT have R2 configured in development', () => {
      expect(isR2Configured()).toBe(false);
    });
  });

  describe('Local Storage', () => {
    it('should use local storage mode', () => {
      expect(getStorageMode()).toBe('local');
    });

    it('should have uploads directory', () => {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      expect(fs.existsSync(uploadsDir)).toBe(true);
    });

    it('should upload and download files locally', async () => {
      const testContent = Buffer.from('Integration test file');
      const remoteKey = 'integration-test/test.txt';

      // Upload
      const url = await uploadBuffer(testContent, remoteKey, 'text/plain');
      expect(url).toContain(remoteKey);

      // Download
      const downloadPath = path.join(process.cwd(), 'uploads', 'test-download.txt');
      await downloadFile(remoteKey, downloadPath);

      expect(fs.existsSync(downloadPath)).toBe(true);
      const content = fs.readFileSync(downloadPath);
      expect(content.toString()).toBe('Integration test file');

      // Cleanup
      fs.unlinkSync(downloadPath);
      const uploadedPath = path.join(process.cwd(), 'uploads', remoteKey);
      fs.unlinkSync(uploadedPath);
      const dir = path.dirname(uploadedPath);
      if (fs.existsSync(dir)) {
        fs.rmdirSync(dir);
      }
    });
  });

  describe('OAuth Configuration', () => {
    it('should have OAuth credentials', () => {
      expect(env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(env.GOOGLE_CLIENT_SECRET).toBeDefined();
      expect(env.GOOGLE_CALLBACK_URL).toBeDefined();
    });

    it('should use localhost callback', () => {
      expect(env.GOOGLE_CALLBACK_URL).toContain('http://localhost');
      expect(env.GOOGLE_CALLBACK_URL).toContain('/auth/google/callback');
    });
  });

  describe('File Structure', () => {
    it('should have all required files', () => {
      const requiredFiles = [
        'docker-compose.yml',
        '.env.local',
        '.env.example',
        '.gitignore',
        'package.json',
        'vite.config.ts',
        'vitest.config.ts',
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have dev-environment-setup directory', () => {
      const setupDir = path.join(process.cwd(), 'dev-environment-setup');
      expect(fs.existsSync(setupDir)).toBe(true);

      const requiredDirs = [
        'FOR-DEVELOPER',
        'FOR-AI',
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(setupDir, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });
  });

  describe('Git Configuration', () => {
    it('should ignore sensitive files', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

      expect(gitignore).toContain('.env.local');
      expect(gitignore).toContain('uploads/');
      expect(gitignore).toContain('docker-compose.override.yml');
    });
  });
});
```

### **הרצת הטסט (צריך להיכשל אם לא הכל מוכן):**

```bash
pnpm test dev-environment-integration.test.ts
```

**Expected Output (אם הכל מוכן):**
```
✅ PASS  server/dev-environment-integration.test.ts
  ✓ Docker MySQL > should connect to MySQL container
  ✓ Docker MySQL > should have ruach_dev database
  ✓ Environment Variables > should have all required variables
  ✓ Environment Variables > should NOT have R2 configured in development
  ✓ Local Storage > should use local storage mode
  ✓ Local Storage > should have uploads directory
  ✓ Local Storage > should upload and download files locally
  ✓ OAuth Configuration > should have OAuth credentials
  ✓ OAuth Configuration > should use localhost callback
  ✓ File Structure > should have all required files
  ✓ File Structure > should have dev-environment-setup directory
  ✓ Git Configuration > should ignore sensitive files

Test Files  1 passed (1)
     Tests  12 passed (12)
```

---

## 🟢 שלב 2: שינויים בקוד (Green Phase)

### **2.1: יצירת סקריפט בדיקה**

**קובץ:** `dev-environment-setup/check-environment.sh`

```bash
#!/bin/bash

# ═══════════════════════════════════════════════════════════
# 🔍 Development Environment Check Script
# ═══════════════════════════════════════════════════════════

set -e

echo "🔍 Checking Development Environment..."
echo ""

# ─── Colors ────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ─── Helper Functions ──────────────────────────────────────
check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ─── Check Docker ──────────────────────────────────────────
echo "📦 Checking Docker..."
if docker ps | grep -q ruach-mysql; then
    check_pass "Docker MySQL container is running"
else
    check_fail "Docker MySQL container is NOT running"
    echo "   Run: docker-compose up -d"
    exit 1
fi
echo ""

# ─── Check .env.local ──────────────────────────────────────
echo "📝 Checking .env.local..."
if [ -f ".env.local" ]; then
    check_pass ".env.local exists"
    
    # Check required variables
    if grep -q "DATABASE_URL=mysql://root:dev_password_2024@localhost:3306/ruach_dev" .env.local; then
        check_pass "DATABASE_URL is configured for local MySQL"
    else
        check_fail "DATABASE_URL is not configured correctly"
    fi
    
    if grep -q "GOOGLE_CLIENT_ID=.*\.apps\.googleusercontent\.com" .env.local; then
        check_pass "GOOGLE_CLIENT_ID is configured"
    else
        check_warn "GOOGLE_CLIENT_ID may not be configured (OAuth won't work)"
    fi
else
    check_fail ".env.local does NOT exist"
    echo "   Copy from .env.example and configure"
    exit 1
fi
echo ""

# ─── Check uploads directory ───────────────────────────────
echo "💾 Checking uploads directory..."
if [ -d "uploads" ]; then
    check_pass "uploads/ directory exists"
else
    check_fail "uploads/ directory does NOT exist"
    echo "   Run: mkdir uploads"
    exit 1
fi
echo ""

# ─── Check Node modules ────────────────────────────────────
echo "📦 Checking Node modules..."
if [ -d "node_modules" ]; then
    check_pass "node_modules/ exists"
else
    check_fail "node_modules/ does NOT exist"
    echo "   Run: pnpm install"
    exit 1
fi
echo ""

# ─── Run Tests ─────────────────────────────────────────────
echo "🧪 Running integration tests..."
if pnpm test dev-environment-integration.test.ts --run; then
    check_pass "All integration tests passed"
else
    check_fail "Some integration tests failed"
    exit 1
fi
echo ""

# ─── Final Summary ─────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the dev server: pnpm dev"
echo "   2. Open http://localhost:3000"
echo "   3. Try logging in with Google OAuth"
echo ""
```

### **2.2: הפיכת הסקריפט לניתן להרצה**

```bash
chmod +x dev-environment-setup/check-environment.sh
```

### **2.3: יצירת מדריך בדיקה**

**קובץ:** `dev-environment-setup/FOR-DEVELOPER/05-TESTING-ENVIRONMENT.md`

```markdown
# ✅ בדיקת סביבת הפיתוח

## 🎯 מטרה

מדריך זה מסביר כיצד לבדוק שסביבת הפיתוח מוכנה לעבודה.

---

## 🚀 בדיקה מהירה

### **אופציה 1: סקריפט אוטומטי**

```bash
./dev-environment-setup/check-environment.sh
```

הסקריפט יבדוק:
- ✅ Docker MySQL רץ
- ✅ .env.local קיים ומוגדר
- ✅ uploads/ directory קיים
- ✅ node_modules מותקן
- ✅ כל הטסטים עוברים

### **אופציה 2: בדיקה ידנית**

```bash
# 1. בדוק Docker
docker ps | grep ruach-mysql

# 2. בדוק .env.local
cat .env.local | grep DATABASE_URL

# 3. הרץ טסטים
pnpm test dev-environment-integration.test.ts

# 4. הפעל שרת
pnpm dev
```

---

## 📋 רשימת בדיקות

### **✅ Docker MySQL**
- [ ] Container רץ: `docker ps | grep ruach-mysql`
- [ ] Database קיים: `docker exec -it ruach-mysql mysql -u root -pdev_password_2024 -e "SHOW DATABASES;"`
- [ ] Healthcheck: `docker-compose ps` (צריך להראות "healthy")

### **✅ Environment Variables**
- [ ] .env.local קיים
- [ ] DATABASE_URL מצביע ל-localhost:3306
- [ ] GOOGLE_CLIENT_ID מוגדר
- [ ] GOOGLE_CLIENT_SECRET מוגדר
- [ ] JWT_SECRET לפחות 16 תווים

### **✅ Local Storage**
- [ ] uploads/ directory קיים
- [ ] uploads/ ב-.gitignore
- [ ] אפשר לכתוב קבצים: `touch uploads/test.txt && rm uploads/test.txt`

### **✅ OAuth**
- [ ] Google OAuth credentials מוגדרים
- [ ] Callback URL: http://localhost:3000/auth/google/callback
- [ ] Test user מוגדר ב-Google Console

### **✅ Dependencies**
- [ ] node_modules מותקן: `ls node_modules`
- [ ] pnpm פועל: `pnpm --version`
- [ ] TypeScript פועל: `pnpm check`

---

## 🧪 הרצת טסטים

### **כל הטסטים:**

```bash
pnpm test
```

**Expected:** כל הטסטים עוברים (או OAuth נכשל אם לא מוגדר)

### **טסטים ספציפיים:**

```bash
# Docker MySQL
pnpm test docker-mysql.test.ts

# Environment files
pnpm test env-files.test.ts

# Local storage
pnpm test local-storage.test.ts

# OAuth config
pnpm test oauth-config.test.ts

# Integration
pnpm test dev-environment-integration.test.ts
```

---

## 🚀 הפעלת השרת

```bash
# הפעל את השרת
pnpm dev

# פתח בדפדפן
open http://localhost:3000
```

**Expected:**
- ✅ Server starts on port 3000
- ✅ No errors in console
- ✅ Homepage loads
- ✅ Can click "Login with Google"

---

## 🆘 פתרון בעיות

### **Docker לא רץ**

```bash
docker-compose up -d
docker-compose ps
```

### **Database connection failed**

```bash
# בדוק שMySQL רץ
docker ps | grep ruach-mysql

# בדוק logs
docker-compose logs mysql

# נסה להתחבר ידנית
docker exec -it ruach-mysql mysql -u root -pdev_password_2024
```

### **OAuth לא עובד**

1. בדוק credentials ב-.env.local
2. ודא שCallback URL נכון ב-Google Console
3. בדוק שהמייל שלך ב-Test Users
4. ראה: `OAUTH-SETUP.md`

### **Storage לא עובד**

```bash
# בדוק שuploads/ קיים
ls -la uploads/

# נסה ליצור קובץ
touch uploads/test.txt
rm uploads/test.txt
```

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0
```

---

## 🔵 שלב 3: Refactor והרצת טסטים

### **3.1: הרץ את הסקריפט**

```bash
./dev-environment-setup/check-environment.sh
```

**Expected Output:**
```
🔍 Checking Development Environment...

📦 Checking Docker...
✅ Docker MySQL container is running

📝 Checking .env.local...
✅ .env.local exists
✅ DATABASE_URL is configured for local MySQL
⚠️  GOOGLE_CLIENT_ID may not be configured (OAuth won't work)

💾 Checking uploads directory...
✅ uploads/ directory exists

📦 Checking Node modules...
✅ node_modules/ exists

🧪 Running integration tests...
✅ All integration tests passed

═══════════════════════════════════════════════════════════
✅ Development environment is ready!
═══════════════════════════════════════════════════════════

🚀 Next steps:
   1. Start the dev server: pnpm dev
   2. Open http://localhost:3000
   3. Try logging in with Google OAuth
```

### **3.2: הרץ את כל הטסטים**

```bash
pnpm test
```

**Expected Output:**
```
✅ PASS  server/dev-environment-integration.test.ts
✅ PASS  server/oauth-config.test.ts (or ❌ if no OAuth)
✅ PASS  server/local-storage.test.ts
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
# 1. הרץ את סקריפט הבדיקה
./dev-environment-setup/check-environment.sh
# Expected: ✅ All checks pass

# 2. הרץ את כל הטסטים
pnpm test
# Expected: ✅ All tests pass

# 3. בדוק TypeScript
pnpm check
# Expected: ✅ No errors

# 4. הפעל את השרת
pnpm dev
# Expected: Server starts successfully

# 5. פתח בדפדפן
open http://localhost:3000
# Expected: Homepage loads
```

---

## 🔙 Rollback Plan

אם משהו לא עובד:

### **אופציה 1: מחק את הקבצים החדשים**

```bash
rm server/dev-environment-integration.test.ts
rm dev-environment-setup/check-environment.sh
rm dev-environment-setup/FOR-DEVELOPER/05-TESTING-ENVIRONMENT.md
```

### **אופציה 2: Rollback מלא**

```bash
git checkout .
```

---

## 📝 Commit Message

```bash
git add server/dev-environment-integration.test.ts dev-environment-setup/check-environment.sh dev-environment-setup/FOR-DEVELOPER/05-TESTING-ENVIRONMENT.md
git commit -m "הוספתי בדיקת אינטגרציה לסביבת פיתוח

- יצרתי טסט אינטגרציה מקיף
- יצרתי סקריפט בדיקה אוטומטי
- יצרתי מדריך בדיקה למפתחים
- כל הטסטים עוברים ✅

Environment is ready for development!"
```

---

## 🎓 מה למדנו

1. **Integration Testing** - בדיקת כל הרכיבים ביחד
2. **Automation** - סקריפט בדיקה אוטומטי
3. **Documentation** - מדריך בדיקה מפורט
4. **Validation** - אימות שהסביבה מוכנה

---

## 🔗 הפרומפט הבא

**06-fix-production-safety.md** - הגנה על פרודקשן

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0  
**סטטוס:** ✅ מוכן לשימוש
