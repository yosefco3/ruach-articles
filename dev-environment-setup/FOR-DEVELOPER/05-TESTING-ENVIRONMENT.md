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
- [ ] SESSION_SECRET מוגדר

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

---

## 🧪 הרצת טסטים

### **כל הטסטים:**

```bash
pnpm test
```

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

# Integration (כל הרכיבים ביחד)
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