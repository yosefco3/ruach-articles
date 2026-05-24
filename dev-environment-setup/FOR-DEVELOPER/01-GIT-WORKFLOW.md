# 📚 מדריך Git/GitHub - עבודה עם פיתוח ופרודקשן

## 🎯 מטרה

מדריך זה מסביר איך לעבוד עם Git ו-GitHub כשיש לך סביבת פיתוח וסביבת פרודקשן, כך שעדכונים ב-GitHub לא ישברו את הפרודקשן.

---

## 📊 המצב הנוכחי

### **לפני:**
```
main branch
  ↓
  כל השינויים ישירות כאן
  ↓
  השרת מתעדכן אוטומטית
  ↓
  😱 סיכון: שינוי יכול לשבור פרודקשן
```

### **אחרי (המצב הרצוי):**
```
main (production)
  ↑
  merge רק אחרי בדיקה מלאה
  ↑
development (פיתוח)
  ↑
  כל השינויים כאן
  ↑
  בדיקה מקומית
```

---

## 🏗️ האסטרטגיה: Branch Strategy

### **שני Branches:**

1. **`main`** - פרודקשן בלבד
   - השרת מושך רק מכאן
   - רק קוד שנבדק ועובד
   - אסור לעשות commit ישירות

2. **`development`** - פיתוח
   - כל העבודה היומיומית כאן
   - אפשר לשבור, לנסות, לבדוק
   - merge ל-`main` רק כשמוכן

---

## 🚀 הגדרה ראשונית (פעם אחת)

### **שלב 1: יצירת branch development**

```bash
# ודא שאתה על main ומעודכן
git checkout main
git pull origin main

# צור branch חדש בשם development
git checkout -b development

# העלה אותו ל-GitHub
git push -u origin development
```

✅ **תוצאה:** עכשיו יש לך שני branches ב-GitHub

---

### **שלב 2: הגדרת branch protection ב-GitHub**

זה מונע commits ישירים ל-`main` ומחייב pull requests.

1. **עבור ל-GitHub:**
   - פתח את הרפוזיטורי: `https://github.com/yosefco3/ruach-articles`

2. **הגדרות:**
   - לחץ על **Settings** (למעלה)
   - בצד שמאל: **Branches**
   - לחץ **Add branch protection rule**

3. **הגדר את main:**
   ```
   Branch name pattern: main
   
   ✅ Require a pull request before merging
   ✅ Require approvals: 0 (אתה לבד, אז לא צריך)
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ✅ Do not allow bypassing the above settings
   ```

4. **שמור:** לחץ **Create**

✅ **תוצאה:** אי אפשר יותר לעשות `git push` ישירות ל-`main`

---

### **שלב 3: הגדרת השרת**

השרת צריך למשוך רק מ-`main`.

**אם יש לך סקריפט deployment על השרת:**

```bash
# התחבר לשרת
ssh user@your-server.com

# עבור לתיקיית הפרויקט
cd /path/to/ruach-articles

# ודא שהשרת על main
git checkout main

# עדכן את הסקריפט deployment (אם יש)
# ודא שהוא מריץ: git pull origin main
```

**אם השרת מתעדכן דרך GitHub Actions/Webhooks:**
- ודא שה-workflow מאזין רק ל-`push` events על `main`
- דוגמה:
  ```yaml
  on:
    push:
      branches:
        - main  # רק main, לא development
  ```

✅ **תוצאה:** השרת מתעדכן רק כש-`main` משתנה

---

## 📅 תהליך עבודה יומיומי

### **1. התחלת יום עבודה**

```bash
# ודא שאתה על development
git checkout development

# עדכן את development מ-GitHub (אם עבדת ממחשב אחר)
git pull origin development

# עדכן גם מ-main (למקרה שיש שינויים חדשים)
git pull origin main
```

---

### **2. עבודה על פיצ'ר חדש**

```bash
# עבוד על הקוד...
# ערוך קבצים, הוסף פיצ'רים, תקן באגים

# בדוק שהכל עובד מקומית
pnpm dev
pnpm test

# כשמוכן, עשה commit
git add .
git commit -m "הוספתי פיצ'ר X"

# העלה ל-GitHub
git push origin development
```

✅ **תוצאה:** השינויים ב-`development`, הפרודקשן לא נגע

---

### **3. בדיקה מקומית לפני העלאה לפרודקשן**

```bash
# הרץ את כל הטסטים
pnpm test

# בדוק שהאפליקציה עובדת
pnpm dev
# פתח בדפדפן: http://localhost:3000
# בדוק את כל הפיצ'רים החדשים

# בדוק שאין שגיאות TypeScript
pnpm check

# בנה את הפרויקט (כמו בפרודקשן)
pnpm build
```

✅ **אם הכל עובד** → המשך לשלב הבא  
❌ **אם משהו לא עובד** → תקן ב-`development` וחזור על הבדיקה

---

### **4. העלאה לפרודקשן (Merge ל-main)**

#### **אופציה א': דרך GitHub (מומלץ)**

1. **עבור ל-GitHub:**
   - `https://github.com/yosefco3/ruach-articles`

2. **צור Pull Request:**
   - לחץ **Pull requests** → **New pull request**
   - Base: `main` ← Compare: `development`
   - לחץ **Create pull request**
   - כתוב תיאור של השינויים
   - לחץ **Create pull request**

3. **בדוק את השינויים:**
   - GitHub יראה לך את כל ההבדלים
   - ודא שהכל נראה טוב

4. **Merge:**
   - לחץ **Merge pull request**
   - לחץ **Confirm merge**

5. **מחק את ה-branch (אופציונלי):**
   - אל תמחק! אנחנו משתמשים ב-`development` כל הזמן

✅ **תוצאה:** השינויים עברו ל-`main`, השרת יתעדכן אוטומטית

---

#### **אופציה ב': דרך Command Line**

```bash
# עבור ל-main
git checkout main

# עדכן את main מ-GitHub
git pull origin main

# Merge את development ל-main
git merge development

# אם יש conflicts - פתור אותם ואז:
# git add .
# git commit -m "Merged development into main"

# העלה את main ל-GitHub
git push origin main

# חזור ל-development
git checkout development
```

✅ **תוצאה:** אותה תוצאה כמו אופציה א'

---

## 🔄 תרחישים נפוצים

### **תרחיש 1: עבדתי ישירות על main בטעות**

```bash
# אם עדיין לא עשית push:
git checkout development
git cherry-pick <commit-hash>  # העתק את ה-commit ל-development
git checkout main
git reset --hard HEAD~1  # מחק את ה-commit מ-main

# אם כבר עשית push:
# צור pull request ב-GitHub מ-main ל-development
# ואז reset את main לגרסה הקודמת
```

---

### **תרחיש 2: רוצה לבטל שינוי שכבר עלה לפרודקשן**

```bash
# אופציה א': Revert (מומלץ)
git checkout main
git revert <commit-hash>  # יוצר commit חדש שמבטל את השינוי
git push origin main

# אופציה ב': Reset (מסוכן!)
git checkout main
git reset --hard <commit-hash-before-the-change>
git push origin main --force  # ⚠️ זהירות! force push
```

---

### **תרחיש 3: יש conflicts בזמן merge**

```bash
# כשעושים merge ויש conflicts:
git merge development
# Auto-merging file.ts
# CONFLICT (content): Merge conflict in file.ts

# פתח את הקובץ ופתור את ה-conflict:
# <<<<<<< HEAD
# קוד מ-main
# =======
# קוד מ-development
# >>>>>>> development

# אחרי שפתרת:
git add file.ts
git commit -m "Resolved merge conflicts"
git push origin main
```

---

### **תרחיש 4: רוצה לעדכן את development מ-main**

```bash
# אם יש שינויים ב-main שאתה רוצה ב-development:
git checkout development
git pull origin main  # מושך שינויים מ-main
git push origin development  # מעדכן את development ב-GitHub
```

---

## 🛡️ כללי בטיחות

### **✅ מה מותר:**
- ✅ Commit ישירות ל-`development`
- ✅ Push ל-`development` כמה שרוצים
- ✅ לשבור דברים ב-`development`
- ✅ לנסות ולבדוק ב-`development`

### **❌ מה אסור:**
- ❌ Commit ישירות ל-`main` (GitHub יחסום)
- ❌ Force push ל-`main`
- ❌ Merge ל-`main` בלי בדיקה
- ❌ למחוק את `development` branch

---

## 📋 Checklist לפני Merge ל-main

לפני שעושים merge מ-`development` ל-`main`:

- [ ] כל הטסטים עוברים: `pnpm test`
- [ ] האפליקציה עובדת מקומית: `pnpm dev`
- [ ] אין שגיאות TypeScript: `pnpm check`
- [ ] הבנייה עובדת: `pnpm build`
- [ ] בדקתי את כל הפיצ'רים החדשים
- [ ] אין console.log או קוד debug
- [ ] עדכנתי את התיעוד (אם צריך)

---

## 🎓 פקודות Git חשובות

### **בדיקת סטטוס:**
```bash
git status              # מה השתנה?
git branch              # על איזה branch אני?
git log --oneline       # היסטוריית commits
git diff                # מה השתנה בקבצים?
```

### **ניווט בין branches:**
```bash
git checkout main           # עבור ל-main
git checkout development    # עבור ל-development
git checkout -b new-branch  # צור branch חדש
```

### **עדכון:**
```bash
git pull origin main        # עדכן מ-main
git pull origin development # עדכן מ-development
git fetch --all             # הורד מידע על כל ה-branches
```

### **ביטול שינויים:**
```bash
git checkout -- file.ts     # בטל שינויים בקובץ
git reset --hard            # בטל את כל השינויים
git clean -fd               # מחק קבצים חדשים
```

---

## 🔗 קישורים שימושיים

- **GitHub Repository:** `https://github.com/yosefco3/ruach-articles`
- **Pull Requests:** `https://github.com/yosefco3/ruach-articles/pulls`
- **Branches:** `https://github.com/yosefco3/ruach-articles/branches`
- **Settings:** `https://github.com/yosefco3/ruach-articles/settings`

---

## 💡 טיפים

1. **Commit לעיתים קרובות** - commits קטנים קל יותר לעקוב אחריהם
2. **כתוב commit messages טובים** - "תיקנתי באג" זה לא מספיק
3. **Pull לפני Push** - תמיד עדכן לפני שמעלה
4. **בדוק לפני Merge** - אל תסמוך על "זה בטח עובד"
5. **גבה את העבודה** - push ל-GitHub כל יום

---

## 🆘 עזרה

אם משהו השתבש:
1. **אל תפאניק** - ב-Git אפשר לתקן כמעט הכל
2. **בדוק את הסטטוס:** `git status`
3. **בדוק את הלוג:** `git log --oneline`
4. **חפש בגוגל** - רוב הבעיות כבר נפתרו
5. **שאל AI** - Cline יכול לעזור

---

**עודכן:** מאי 2026  
**גרסה:** 1.0.0
