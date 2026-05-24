# ⚠️ חשוב מאוד - NPX בלבד!

## 🚨 הערה קריטית למחשב זה

**במחשב זה, npm ו-pnpm לא עובדים כראוי!**

**תמיד השתמש ב-`npx` במקום `npm` או `pnpm`!**

---

## ✅ פקודות נכונות

### **במקום:**
```bash
# ❌ לא עובד
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm check
```

### **השתמש ב:**
```bash
# ✅ עובד
npx pnpm install
npx pnpm dev
npx pnpm test
npx pnpm build
npx pnpm check
```

---

## 📋 דוגמאות שימוש

### **התקנת dependencies:**
```bash
npx pnpm install
```

### **הרצת שרת פיתוח:**
```bash
npx pnpm dev
```

### **הרצת טסטים:**
```bash
npx pnpm test
npx pnpm test docker-mysql.test.ts
npx pnpm test --run
```

### **בדיקת TypeScript:**
```bash
npx pnpm check
```

### **Build לפרודקשן:**
```bash
npx pnpm build
```

---

## 🔧 עדכון הפרומפטים

**כל הפרומפטים (01-06) צריכים להשתמש ב-`npx pnpm` במקום `pnpm`!**

דוגמה:
```bash
# במקום:
pnpm test docker-mysql.test.ts

# כתוב:
npx pnpm test docker-mysql.test.ts
```

---

## 📝 הערה לעצמי

- ✅ תמיד `npx pnpm` במחשב זה
- ✅ עדכן את כל הפרומפטים בהתאם
- ✅ עדכן את check-environment.sh
- ✅ עדכן את המדריכים למפתח

---

**נוצר:** מאי 2026  
**עודכן:** מאי 2026  
**סטטוס:** 🚨 קריטי - קרא לפני כל שימוש!
