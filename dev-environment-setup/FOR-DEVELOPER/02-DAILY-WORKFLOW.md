# 📅 תהליך עבודה יומיומי - מדריך מהיר

## 🎯 מטרה

מדריך מהיר לתהליך העבודה היומיומי עם סביבת הפיתוח.

---

## ☀️ התחלת יום עבודה

### **1. עדכון הקוד**

```bash
# ודא שאתה על development
git checkout development

# עדכן מ-GitHub
git pull origin development

# עדכן גם מ-main (למקרה שיש שינויים חדשים)
git pull origin main
```

### **2. הפעלת סביבת הפיתוח**

```bash
# הפעל את Docker (MySQL)
docker-compose up -d

# הפעל את שרת הפיתוח
pnpm dev
```

✅ **תוצאה:** האפליקציה רצה ב-`http://localhost:3000`

---

## 💻 עבודה על פיצ'ר חדש

### **תהליך TDD (Test-Driven Development):**

#### **שלב 1: כתוב טסט (Red)**

```bash
# צור/ערוך קובץ טסט
code server/my-feature.test.ts

# כתוב טסט שנכשל
# הרץ את הטסט
pnpm test my-feature.test.ts

# Expected: ❌ Test fails
```

#### **שלב 2: כתוב קוד (Green)**

```bash
# כתוב את הקוד שגורם לטסט לעבור
code server/my-feature.ts

# הרץ את הטסט שוב
pnpm test my-feature.test.ts

# Expected: ✅ Test passes
```

#### **שלב 3: שפר (Refactor)**

```bash
# שפר את הקוד
# הרץ את כל הטסטים
pnpm test

# Expected: ✅ All tests pass
```

---

## 🧪 בדיקות לפני Commit

```bash
# 1. הרץ את כל הטסטים
pnpm test

# 2. בדוק TypeScript
pnpm check

# 3. בדוק שהאפליקציה עובדת
pnpm dev
# פתח בדפדפן: http://localhost:3000
# בדוק את הפיצ'ר החדש

# 4. בנה את הפרויקט
pnpm build
```

✅ **אם הכל עובד** → המשך ל-commit  
❌ **אם משהו לא עובד** → תקן ובדוק שוב

---

## 📝 Commit ו-Push

```bash
# הוסף את כל השינויים
git add .

# עשה commit עם הודעה ברורה
git commit -m "הוספתי פיצ'ר X: [תיאור קצר]"

# דוגמאות לcommit messages טובים:
# git commit -m "הוספתי אחסון מקומי לפיתוח"
# git commit -m "תיקנתי באג בטופס יצירת קשר"
# git commit -m "שיפרתי ביצועים של טעינת מאמרים"

# העלה ל-GitHub
git push origin development
```

✅ **תוצאה:** השינויים ב-`development`, הפרודקשן בטוח

---

## 🔄 עבודה על כמה פיצ'רים במקביל

אם אתה עובד על כמה דברים במקביל, צור feature branches:

```bash
# צור branch חדש מ-development
git checkout development
git checkout -b feature/new-feature

# עבוד על הפיצ'ר...
git add .
git commit -m "עבודה על פיצ'ר חדש"
git push origin feature/new-feature

# כשמוכן, merge חזרה ל-development:
git checkout development
git merge feature/new-feature
git push origin development

# מחק את ה-feature branch
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

---

## 🚀 העלאה לפרודקשן

### **Checklist לפני העלאה:**

- [ ] כל הטסטים עוברים: `pnpm test`
- [ ] האפליקציה עובדת: `pnpm dev`
- [ ] אין שגיאות TypeScript: `pnpm check`
- [ ] הבנייה עובדת: `pnpm build`
- [ ] בדקתי את כל הפיצ'רים החדשים
- [ ] אין console.log או קוד debug
- [ ] עדכנתי תיעוד (אם צריך)

### **תהליך העלאה:**

#### **אופציה 1: דרך GitHub (מומלץ)**

1. עבור ל-`https://github.com/yosefco3/ruach-articles`
2. לחץ **Pull requests** → **New pull request**
3. Base: `main` ← Compare: `development`
4. כתוב תיאור של השינויים
5. לחץ **Create pull request**
6. בדוק את השינויים
7. לחץ **Merge pull request**

#### **אופציה 2: דרך Command Line**

```bash
git checkout main
git pull origin main
git merge development
git push origin main
git checkout development
```

✅ **תוצאה:** השרת יתעדכן אוטומטית תוך כמה דקות

---

## 🌙 סיום יום עבודה

```bash
# ודא שהכל ב-commit
git status

# אם יש שינויים שלא נשמרו:
git add .
git commit -m "עבודה בסוף היום"
git push origin development

# עצור את Docker (אופציונלי)
docker-compose down
```

---

## 🔧 פקודות שימושיות

### **בדיקת סטטוס:**
```bash
git status              # מה השתנה?
git branch              # על איזה branch אני?
git log --oneline -5    # 5 commits אחרונים
```

### **ביטול שינויים:**
```bash
git checkout -- file.ts     # בטל שינויים בקובץ אחד
git reset --hard            # בטל את כל השינויים
git clean -fd               # מחק קבצים חדשים
```

### **עזרה מהירה:**
```bash
pnpm dev                # הפעל שרת פיתוח
pnpm test               # הרץ טסטים
pnpm check              # בדוק TypeScript
pnpm build              # בנה לפרודקשן
docker-compose up -d    # הפעל MySQL
docker-compose down     # עצור MySQL
```

---

## 📊 דוגמה ליום עבודה טיפוסי

```bash
# 09:00 - התחלת יום
git checkout development
git pull origin development
docker-compose up -d
pnpm dev

# 09:30 - עבודה על פיצ'ר חדש
code server/new-feature.test.ts  # כתוב טסט
pnpm test new-feature.test.ts    # ❌ נכשל
code server/new-feature.ts       # כתוב קוד
pnpm test new-feature.test.ts    # ✅ עובר

# 12:00 - commit ראשון
git add .
git commit -m "הוספתי פיצ'ר X - חלק 1"
git push origin development

# 14:00 - המשך עבודה
# ... עוד קוד ועוד טסטים ...

# 17:00 - commit שני
git add .
git commit -m "השלמתי פיצ'ר X"
git push origin development

# 17:30 - בדיקה לפני העלאה
pnpm test     # ✅
pnpm check    # ✅
pnpm build    # ✅

# 18:00 - העלאה לפרודקשן
# יצירת Pull Request ב-GitHub
# Merge ל-main

# 18:30 - סיום יום
docker-compose down
```

---

## 💡 טיפים

1. **Commit לעיתים קרובות** - כל שעה-שעתיים
2. **Push כל יום** - גיבוי אוטומטי
3. **הרץ טסטים לפני commit** - חוסך זמן
4. **כתוב commit messages ברורים** - עזור לעצמך בעתיד
5. **בדוק את הפרודקשן אחרי merge** - ודא שהכל עובד

---

## 🆘 בעיות נפוצות

### **הטסטים נכשלים:**
```bash
# בדוק איזה טסט נכשל
pnpm test

# הרץ טסט ספציפי
pnpm test my-feature.test.ts

# בדוק את הלוגים
```

### **האפליקציה לא עולה:**
```bash
# בדוק שDocker רץ
docker ps

# בדוק את הלוגים
pnpm dev

# בדוק את .env.local
cat .env.local
```

### **יש conflicts ב-merge:**
```bash
# פתח את הקובץ עם ה-conflict
code [file-with-conflict]

# פתור את ה-conflict ידנית
# חפש את:
# <<<<<<< HEAD
# =======
# >>>>>>> development

# אחרי שפתרת:
git add [file]
git commit -m "Resolved conflicts"
```

---

## 🔗 קישורים מהירים

- **Git Workflow המלא:** `01-GIT-WORKFLOW.md`
- **Deployment:** `03-DEPLOYMENT.md`
- **Troubleshooting:** `04-TROUBLESHOOTING.md`
- **פרומפטים ל-AI:** `../FOR-AI/`

---

**עודכן:** מאי 2026  
**גרסה:** 1.0.0
