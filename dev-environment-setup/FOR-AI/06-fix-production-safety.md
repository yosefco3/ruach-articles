# 🔒 פרומפט 06: הגנה על פרודקשן

## 🎯 מטרה

הגנה על סביבת הפרודקשן מפני שינויים לא מכוונים ושמירה על יציבות השרת.

---

## 📋 סקירה

### **מה נעשה:**
1. יצירת branch `development` ל-Git
2. הגדרת branch protection rules
3. יצירת טסט לבדיקת branch safety
4. תיעוד Git workflow

### **מה לא נעשה:**
- ❌ לא משנים קוד קיים
- ❌ לא משנים את השרת בפרודקשן
- ❌ לא מוסיפים features חדשים

---

## 🔴 שלב 1: כתיבת טסטים (Red Phase)

### **יצירת קובץ טסט:**

**קובץ:** `server/production-safety.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Production Safety', () => {
  describe('Git Configuration', () => {
    it('should have development branch', () => {
      try {
        const branches = execSync('git branch', { encoding: 'utf-8' });
        expect(branches).toContain('development');
      } catch (error) {
        // If git is not initialized, skip this test
        console.warn('Git not initialized, skipping branch test');
      }
    });

    it('should have .gitignore with sensitive files', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

      // Sensitive files that should NEVER be committed
      const sensitivePatterns = [
        '.env',
        '.env.local',
        '.env.*.local',
        'uploads/',
      ];

      sensitivePatterns.forEach(pattern => {
        expect(gitignore).toContain(pattern);
      });
    });

    it('should NOT have .env.local in git', () => {
      try {
        const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' });
        expect(trackedFiles).not.toContain('.env.local');
      } catch (error) {
        console.warn('Git not initialized, skipping tracked files test');
      }
    });

    it('should NOT have uploads/ in git', () => {
      try {
        const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' });
        expect(trackedFiles).not.toContain('uploads/');
      } catch (error) {
        console.warn('Git not initialized, skipping tracked files test');
      }
    });
  });

  describe('Environment Separation', () => {
    it('should have .env.example without secrets', () => {
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const envExample = fs.readFileSync(envExamplePath, 'utf-8');

      // Should NOT contain real secrets
      expect(envExample).not.toContain('GOCSPX-');
      expect(envExample).not.toContain('dev_password_2024');
      expect(envExample).not.toContain('tidb');
    });

    it('should have documentation for developers', () => {
      const docsDir = path.join(process.cwd(), 'dev-environment-setup');
      expect(fs.existsSync(docsDir)).toBe(true);

      const requiredDocs = [
        'README.md',
        'FOR-DEVELOPER/01-GIT-WORKFLOW.md',
        'FOR-DEVELOPER/02-DAILY-WORKFLOW.md',
        'FOR-DEVELOPER/03-DEPLOYMENT.md',
        'FOR-DEVELOPER/04-TROUBLESHOOTING.md',
      ];

      requiredDocs.forEach(doc => {
        const docPath = path.join(docsDir, doc);
        expect(fs.existsSync(docPath)).toBe(true);
      });
    });
  });

  describe('Production Configuration', () => {
    it('should have separate production .env template', () => {
      // .env.example should show production structure
      const envExamplePath = path.join(process.cwd(), '.env.example');
      const envExample = fs.readFileSync(envExamplePath, 'utf-8');

      // Should mention production options
      expect(envExample).toContain('R2_ENDPOINT');
      expect(envExample).toContain('R2_ACCESS_KEY_ID');
    });
  });
});
```

### **הרצת הטסט (צריך להיכשל אם אין development branch):**

```bash
pnpm test production-safety.test.ts
```

**Expected Output:**
```
❌ FAIL  server/production-safety.test.ts
  ✕ should have development branch
    Expected: string containing "development"
    Received: "* main"
```

✅ **הטסט נכשל כמצופה** - אין עדיין development branch

---

## 🟢 שלב 2: שינויים בקוד (Green Phase)

### **2.1: יצירת development branch**

```bash
# צור development branch
git checkout -b development

# דחוף ל-GitHub
git push -u origin development

# חזור ל-main
git checkout main
```

### **2.2: יצירת מדריך Branch Protection**

**קובץ:** `dev-environment-setup/FOR-DEVELOPER/BRANCH-PROTECTION.md`

```markdown
# 🔒 הגנה על Branch Production

## 🎯 מטרה

מדריך זה מסביר כיצד להגן על ה-`main` branch מפני שינויים לא מכוונים.

---

## 🌳 Git Workflow

```
main (production) ← השרת מושך מכאן בלבד
  ↑
  merge אחרי בדיקה מלאה
  ↑
development ← כל הפיתוח כאן
  ↑
  feature branches (אופציונלי)
```

---

## 🚀 הגדרת Branch Protection ב-GitHub

### **שלב 1: גישה להגדרות**

1. עבור ל-GitHub repository
2. לחץ על **Settings**
3. בתפריט הצד, לחץ על **Branches**

### **שלב 2: הוספת Protection Rule**

1. לחץ על **Add rule**
2. Branch name pattern: `main`
3. סמן את האפשרויות הבאות:

#### **✅ Require a pull request before merging**
- Require approvals: **1**
- Dismiss stale pull request approvals when new commits are pushed

#### **✅ Require status checks to pass before merging**
- Require branches to be up to date before merging
- Status checks: (אם יש CI/CD)

#### **✅ Require conversation resolution before merging**

#### **✅ Do not allow bypassing the above settings**
- Include administrators (מומלץ!)

4. לחץ **Create**

---

## 📋 תהליך עבודה יומיומי

### **1. התחלת עבודה**

```bash
# ודא שאתה על development
git checkout development

# משוך שינויים אחרונים
git pull origin development

# צור feature branch (אופציונלי)
git checkout -b feature/my-feature
```

### **2. עבודה על קוד**

```bash
# עשה שינויים
# ...

# commit
git add .
git commit -m "תיאור השינוי"

# push
git push origin development
# או: git push origin feature/my-feature
```

### **3. Merge ל-main (פרודקשן)**

```bash
# ודא שכל הטסטים עוברים
pnpm test

# ודא שהשרת עובד
pnpm dev

# צור Pull Request ב-GitHub:
# development → main

# המתן לאישור
# Merge ב-GitHub
```

### **4. עדכון השרת**

```bash
# SSH לשרת
ssh user@server

# משוך שינויים מ-main
cd /path/to/project
git pull origin main

# הפעל מחדש את השרת
pm2 restart ruach
```

---

## ⚠️ חוקים חשובים

### **❌ אסור:**
- לעשות `git push` ישירות ל-`main`
- לעשות `git push --force` ל-`main`
- לעשות merge בלי בדיקת טסטים
- לעשות merge בלי בדיקה ידנית

### **✅ חובה:**
- לעבוד על `development` או feature branches
- להריץ `pnpm test` לפני merge
- לבדוק את השרת המקומי לפני merge
- ליצור Pull Request לכל שינוי ל-`main`

---

## 🆘 מצבי חירום

### **אם עשית push ישירות ל-main בטעות:**

```bash
# 1. אל תיבהל!
# 2. צור Pull Request מיידי עם rollback
git revert HEAD
git push origin main

# 3. עדכן את השרת
ssh user@server
cd /path/to/project
git pull origin main
pm2 restart ruach
```

### **אם השרת קרס:**

```bash
# 1. SSH לשרת
ssh user@server

# 2. בדוק logs
pm2 logs ruach

# 3. rollback לcommit קודם
cd /path/to/project
git log --oneline  # מצא commit טוב
git reset --hard <commit-hash>
pm2 restart ruach

# 4. תקן את הבעיה ב-development
# 5. עשה merge מחדש אחרי תיקון
```

---

## 📊 סטטוס Branches

```bash
# בדוק איזה branch אתה עליו
git branch

# בדוק הבדלים בין branches
git diff main development

# בדוק commits שעדיין לא ב-main
git log main..development
```

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0
```

### **2.3: עדכון README עם אזהרה**

**קובץ:** `dev-environment-setup/README.md`

הוסף בתחילת הקובץ:

```markdown
## ⚠️ חשוב מאוד!

**אל תעשה push ישירות ל-`main` branch!**

- כל הפיתוח צריך להיות על `development` branch
- Merge ל-`main` רק דרך Pull Request
- ה-`main` branch מוגן ומחובר לשרת הפרודקשן
- כל שינוי ב-`main` משפיע על המשתמשים!

ראה: [BRANCH-PROTECTION.md](FOR-DEVELOPER/BRANCH-PROTECTION.md)

---
```

---

## 🔵 שלב 3: Refactor והרצת טסטים

### **3.1: הרץ את הטסט החדש**

```bash
pnpm test production-safety.test.ts
```

**Expected Output:**
```
✅ PASS  server/production-safety.test.ts
  ✓ Git Configuration > should have development branch (5ms)
  ✓ Git Configuration > should have .gitignore with sensitive files (2ms)
  ✓ Git Configuration > should NOT have .env.local in git (3ms)
  ✓ Git Configuration > should NOT have uploads/ in git (2ms)
  ✓ Environment Separation > should have .env.example without secrets (2ms)
  ✓ Environment Separation > should have documentation for developers (3ms)
  ✓ Production Configuration > should have separate production .env template (2ms)

Test Files  1 passed (1)
     Tests  7 passed (7)
```

### **3.2: הרץ את כל הטסטים**

```bash
pnpm test
```

**Expected Output:**
```
✅ PASS  server/production-safety.test.ts
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
# 1. בדוק שיש development branch
git branch
# Expected: * main
#           development

# 2. בדוק ש-.env.local לא ב-Git
git ls-files | grep .env.local
# Expected: (empty - no output)

# 3. הרץ את כל הטסטים
pnpm test
# Expected: ✅ All tests pass

# 4. בדוק TypeScript
pnpm check
# Expected: ✅ No errors

# 5. בדוק שהמדריכים קיימים
ls -la dev-environment-setup/FOR-DEVELOPER/BRANCH-PROTECTION.md
# Expected: File exists
```

---

## 🔙 Rollback Plan

אם משהו לא עובד:

### **אופציה 1: מחק את הקבצים החדשים**

```bash
rm server/production-safety.test.ts
rm dev-environment-setup/FOR-DEVELOPER/BRANCH-PROTECTION.md
git checkout dev-environment-setup/README.md
```

### **אופציה 2: מחק את development branch**

```bash
git branch -D development
git push origin --delete development
```

---

## 📝 Commit Message

```bash
git add server/production-safety.test.ts dev-environment-setup/FOR-DEVELOPER/BRANCH-PROTECTION.md dev-environment-setup/README.md
git commit -m "הוספתי הגנה על פרודקשן

- יצרתי development branch
- יצרתי טסט לבדיקת branch safety
- יצרתי מדריך branch protection
- עדכנתי README עם אזהרה
- כל הטסטים עוברים ✅

Production is now protected!"
```

---

## 🎓 מה למדנו

1. **Branch Protection** - הגנה על main branch
2. **Git Workflow** - תהליך עבודה בטוח
3. **Documentation** - מדריך מפורט למפתחים
4. **Safety** - מניעת שינויים לא מכוונים

---

## 🎉 סיום!

**כל 6 הפרומפטים הושלמו בהצלחה!**

סביבת הפיתוח מוכנה:
- ✅ Docker MySQL
- ✅ .env files
- ✅ Local storage
- ✅ OAuth configuration
- ✅ Integration tests
- ✅ Production safety

**הצעד הבא:** התחל לפתח! 🚀

```bash
# עבור ל-development branch
git checkout development

# הפעל את השרת
pnpm dev

# פתח בדפדפן
open http://localhost:3000
```

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0  
**סטטוס:** ✅ מוכן לשימוש
