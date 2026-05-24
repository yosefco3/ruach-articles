# 🚀 מדריך Deployment - העלאה לפרודקשן

## 🎯 מטרה

מדריך מפורט להעלאה בטוחה של שינויים מסביבת הפיתוח לפרודקשן.

---

## ⚠️ עקרונות חשובים

1. **אף שינוי לא עולה לפרודקשן בלי בדיקה מלאה**
2. **תמיד יש לך rollback plan**
3. **בדוק את הפרודקשן אחרי deployment**
4. **תעד מה עשית**

---

## 📋 Checklist לפני Deployment

### **1. בדיקות טכניות:**

```bash
# הרץ את כל הטסטים
pnpm test
# Expected: ✅ All tests pass

# בדוק TypeScript
pnpm check
# Expected: ✅ No errors

# בנה את הפרויקט
pnpm build
# Expected: ✅ Build successful
```

### **2. בדיקות פונקציונליות:**

```bash
# הפעל את האפליקציה מקומית
pnpm dev
```

בדוק בדפדפן (`http://localhost:3000`):
- [ ] דף הבית נטען
- [ ] כל הפיצ'רים החדשים עובדים
- [ ] לא שברת פיצ'רים קיימים
- [ ] אין שגיאות בconsole
- [ ] האפליקציה מהירה (לא איטית)

### **3. בדיקות קוד:**

- [ ] אין `console.log` או קוד debug
- [ ] אין `TODO` או `FIXME` קריטיים
- [ ] הקוד מתועד (comments במקומות מורכבים)
- [ ] commit messages ברורים
- [ ] אין קבצים מיותרים (`.env.local`, `node_modules`, וכו')

### **4. בדיקות אבטחה:**

- [ ] אין סודות בקוד (API keys, passwords)
- [ ] כל הסודות ב-`.env` (לא בקוד)
- [ ] `.env.local` ב-`.gitignore`
- [ ] אין נתונים רגישים בlogs

---

## 🚀 תהליך Deployment

### **שיטה 1: דרך GitHub (מומלץ)**

#### **שלב 1: צור Pull Request**

1. **עבור ל-GitHub:**
   ```
   https://github.com/yosefco3/ruach-articles/pulls
   ```

2. **לחץ "New pull request"**

3. **הגדר:**
   - Base: `main`
   - Compare: `development`

4. **כתוב תיאור מפורט:**
   ```markdown
   ## שינויים
   - הוספתי פיצ'ר X
   - תיקנתי באג Y
   - שיפרתי ביצועים של Z
   
   ## בדיקות
   - [x] כל הטסטים עוברים
   - [x] בדקתי מקומית
   - [x] אין שגיאות
   
   ## השפעה
   - משתמשים יראו את פיצ'ר X
   - ביצועים ישתפרו ב-20%
   
   ## Rollback
   - אם משהו לא עובד: revert commit ABC123
   ```

5. **לחץ "Create pull request"**

#### **שלב 2: בדוק את ה-PR**

1. **עבור על הקוד:**
   - GitHub יראה לך את כל ההבדלים
   - ודא שהכל נראה טוב
   - אין שינויים לא מכוונים

2. **בדוק את ה-Checks (אם יש CI/CD):**
   - ודא שכל הטסטים עברו
   - ודא שהבנייה הצליחה

#### **שלב 3: Merge**

1. **לחץ "Merge pull request"**
2. **בחר merge strategy:**
   - **"Create a merge commit"** (מומלץ) - שומר היסטוריה מלאה
   - "Squash and merge" - מאחד את כל ה-commits לאחד
   - "Rebase and merge" - מיישר את ההיסטוריה

3. **לחץ "Confirm merge"**

4. **אל תמחק את `development` branch!**

✅ **תוצאה:** השינויים עברו ל-`main`

---

### **שיטה 2: דרך Command Line**

```bash
# 1. ודא שאתה על development ומעודכן
git checkout development
git pull origin development

# 2. עבור ל-main
git checkout main
git pull origin main

# 3. Merge את development
git merge development

# 4. אם יש conflicts - פתור אותם:
# - פתח את הקבצים עם conflicts
# - פתור את הבעיות
# - git add [files]
# - git commit -m "Resolved merge conflicts"

# 5. העלה ל-GitHub
git push origin main

# 6. חזור ל-development
git checkout development
```

✅ **תוצאה:** אותה תוצאה כמו שיטה 1

---

## 🔄 מה קורה אחרי ה-Merge?

### **1. השרת מתעדכן אוטומטית**

השרת מושך את הקוד החדש מ-`main`:

```bash
# על השרת (אוטומטי):
cd /path/to/ruach-articles
git pull origin main
pnpm install  # אם יש תלויות חדשות
pnpm build
pm2 restart ruach-articles  # או restart אחר
```

**זמן עדכון:** 2-5 דקות בדרך כלל

---

### **2. בדוק שהפרודקשן עובד**

```bash
# פתח את האתר בדפדפן
# https://your-production-domain.com

# בדוק:
# - האתר נטען
# - הפיצ'רים החדשים עובדים
# - אין שגיאות בconsole
# - הכל מהיר
```

**אם משהו לא עובד** → עבור ל-"Rollback" למטה

---

## 🔙 Rollback - ביטול שינויים

אם משהו השתבש בפרודקשן, יש כמה אופציות:

### **אופציה 1: Revert (מומלץ)**

זה יוצר commit חדש שמבטל את השינויים:

```bash
# 1. מצא את ה-commit שרוצים לבטל
git log --oneline
# abc123 - הוספתי פיצ'ר X (זה מה שרוצים לבטל)

# 2. Revert
git checkout main
git revert abc123

# 3. Push
git push origin main
```

✅ **יתרונות:**
- בטוח - לא מוחק היסטוריה
- אפשר לעקוב אחרי מה קרה
- אפשר ל-revert את ה-revert אחר כך

---

### **אופציה 2: Reset (מסוכן!)**

זה מוחק commits מההיסטוריה:

```bash
# ⚠️ זהירות! זה מוחק היסטוריה!

# 1. מצא את ה-commit הטוב האחרון
git log --oneline
# def456 - הכל עבד כאן (לפני השינוי הבעייתי)

# 2. Reset
git checkout main
git reset --hard def456

# 3. Force push
git push origin main --force
```

❌ **חסרונות:**
- מסוכן - מוחק היסטוריה
- אי אפשר לחזור אחורה
- עלול לבלבל אנשים אחרים

**השתמש בזה רק אם:**
- אתה לבד בפרויקט
- זה deployment חדש (אף אחד לא השתמש בו)
- אין ברירה אחרת

---

### **אופציה 3: Hotfix Branch**

אם צריך לתקן משהו מהר:

```bash
# 1. צור hotfix branch מ-main
git checkout main
git checkout -b hotfix/fix-critical-bug

# 2. תקן את הבאג
# ... ערוך קבצים ...

# 3. Commit
git add .
git commit -m "תיקון חירום: [תיאור]"

# 4. Merge ל-main
git checkout main
git merge hotfix/fix-critical-bug
git push origin main

# 5. Merge גם ל-development
git checkout development
git merge hotfix/fix-critical-bug
git push origin development

# 6. מחק את ה-hotfix branch
git branch -d hotfix/fix-critical-bug
```

---

## 📊 מעקב אחרי Deployment

### **1. לוגים על השרת**

```bash
# התחבר לשרת
ssh user@your-server.com

# בדוק לוגים
pm2 logs ruach-articles
# או
tail -f /var/log/ruach-articles/error.log
```

### **2. מעקב אחרי שגיאות**

- בדוק את console בדפדפן
- בדוק לוגים על השרת
- בדוק שאין שגיאות 500
- בדוק שהמשתמשים לא מתלוננים

### **3. ביצועים**

- האתר מהיר?
- אין timeouts?
- בסיס הנתונים עובד?

---

## 📅 תזמון Deployment

### **מתי לעשות deployment?**

✅ **זמנים טובים:**
- בוקר (09:00-11:00) - יש זמן לתקן אם משהו לא עובד
- אמצע שבוע (ג'-ד') - לא בסוף שבוע
- כשאתה זמין - אל תעשה deployment ותלך הביתה

❌ **זמנים רעים:**
- ערב (18:00+) - אין זמן לתקן
- סוף שבוע - אתה לא זמין
- לפני חג - אתה לא זמין
- בזמן שיא תנועה - עלול להפריע למשתמשים

---

## 🎓 Best Practices

### **1. Deployment קטנים ותכופים**

✅ **טוב:**
- Deploy כל יום-יומיים
- שינויים קטנים
- קל לזהות בעיות

❌ **רע:**
- Deploy פעם בחודש
- המון שינויים
- קשה לזהות מה השתבש

### **2. תיעוד**

כתוב changelog:

```markdown
# Changelog

## 2026-05-24
- הוספתי פיצ'ר X
- תיקנתי באג Y
- שיפרתי ביצועים של Z

## 2026-05-23
- ...
```

### **3. תקשורת**

אם יש משתמשים:
- הודע להם על שינויים גדולים
- הסבר מה חדש
- הזהר אותם אם יש downtime

---

## 🆘 בעיות נפוצות

### **הפרודקשן לא מתעדכן**

```bash
# בדוק על השרת:
ssh user@your-server.com
cd /path/to/ruach-articles
git status
git log --oneline -5

# אם צריך לעדכן ידנית:
git pull origin main
pnpm install
pnpm build
pm2 restart ruach-articles
```

### **יש שגיאות אחרי deployment**

```bash
# בדוק לוגים:
pm2 logs ruach-articles

# אם צריך rollback:
git revert [commit-hash]
git push origin main
```

### **הבנייה נכשלת**

```bash
# בדוק מה השגיאה:
pnpm build

# תקן את השגיאה
# Commit ו-push
```

---

## 🔗 קישורים שימושיים

- **GitHub Repository:** `https://github.com/yosefco3/ruach-articles`
- **Pull Requests:** `https://github.com/yosefco3/ruach-articles/pulls`
- **Git Workflow:** `01-GIT-WORKFLOW.md`
- **Daily Workflow:** `02-DAILY-WORKFLOW.md`

---

**עודכן:** מאי 2026  
**גרסה:** 1.0.0
