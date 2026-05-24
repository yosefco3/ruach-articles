# 🔧 פתרון בעיות נפוצות - Troubleshooting

## 🎯 מטרה

מדריך לפתרון בעיות נפוצות בסביבת הפיתוח והפרודקשן.

---

## 🚨 בעיות Git

### **בעיה: "Your branch is behind 'origin/development'"**

```bash
# פתרון:
git pull origin development
```

### **בעיה: "Merge conflict"**

```bash
# 1. בדוק אילו קבצים יש בהם conflict
git status

# 2. פתח כל קובץ ופתור את ה-conflict
# חפש את:
# <<<<<<< HEAD
# הקוד שלך
# =======
# הקוד מ-GitHub
# >>>>>>> development

# 3. אחרי שפתרת, הוסף את הקבצים
git add [file-with-conflict]

# 4. סיים את ה-merge
git commit -m "Resolved merge conflicts"
```

### **בעיה: "Permission denied (publickey)"**

```bash
# בדוק שיש לך SSH key
ls -la ~/.ssh

# אם אין, צור אחד:
ssh-keygen -t ed25519 -C "your_email@example.com"

# הוסף ל-GitHub:
cat ~/.ssh/id_ed25519.pub
# העתק את התוכן ל-GitHub Settings > SSH Keys
```

### **בעיה: עשיתי commit בטעות ל-main**

```bash
# אם עדיין לא עשית push:
git checkout development
git cherry-pick <commit-hash>
git checkout main
git reset --hard HEAD~1

# אם כבר עשית push:
# צור pull request מ-main ל-development
# ואז revert ב-main
```

### **בעיה: רוצה לבטל commit אחרון**

```bash
# אם עדיין לא עשית push:
git reset --soft HEAD~1  # שומר את השינויים
# או
git reset --hard HEAD~1  # מוחק את השינויים

# אם כבר עשית push:
git revert HEAD
git push origin development
```

---

## 🐳 בעיות Docker

### **בעיה: "Cannot connect to the Docker daemon"**

```bash
# בדוק שDocker רץ:
sudo systemctl status docker

# אם לא רץ, הפעל:
sudo systemctl start docker

# הוסף את עצמך לקבוצת docker:
sudo usermod -aG docker $USER
# התנתק והתחבר מחדש
```

### **בעיה: "Port 3306 is already in use"**

```bash
# בדוק מי משתמש בפורט:
sudo lsof -i :3306

# אם זה MySQL מקומי, עצור אותו:
sudo systemctl stop mysql

# או שנה את הפורט ב-docker-compose.yml:
ports:
  - "3307:3306"  # במקום 3306:3306
```

### **בעיה: Docker container לא עולה**

```bash
# בדוק לוגים:
docker-compose logs mysql

# נסה להפעיל מחדש:
docker-compose down
docker-compose up -d

# אם זה לא עוזר, מחק volumes:
docker-compose down -v
docker-compose up -d
```

### **בעיה: "No space left on device"**

```bash
# נקה Docker images ישנים:
docker system prune -a

# נקה volumes שלא בשימוש:
docker volume prune
```

---

## 💾 בעיות בסיס נתונים

### **בעיה: "Access denied for user"**

```bash
# בדוק את .env.local:
cat .env.local | grep DATABASE_URL

# ודא שה-URL נכון:
# DATABASE_URL=mysql://user:password@localhost:3306/ruach_dev
```

### **בעיה: "Table doesn't exist"**

```bash
# הרץ migrations:
pnpm db:push

# אם זה לא עוזר, בדוק שהטבלאות קיימות:
docker exec -it ruach-mysql mysql -u root -p
# הכנס סיסמה
USE ruach_dev;
SHOW TABLES;
```

### **בעיה: "Too many connections"**

```bash
# הגדל את max_connections ב-docker-compose.yml:
command: --max-connections=200

# הפעל מחדש:
docker-compose down
docker-compose up -d
```

---

## 📦 בעיות pnpm/npm

### **בעיה: "Cannot find module"**

```bash
# התקן תלויות מחדש:
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### **בעיה: "EACCES: permission denied"**

```bash
# אל תשתמש ב-sudo!
# תקן הרשאות:
sudo chown -R $USER:$USER ~/.pnpm-store
sudo chown -R $USER:$USER node_modules
```

### **בעיה: "Disk space full"**

```bash
# נקה cache:
pnpm store prune

# מחק node_modules ישנים:
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
```

---

## 🧪 בעיות טסטים

### **בעיה: טסט נכשל בלי סיבה ברורה**

```bash
# הרץ את הטסט עם verbose:
pnpm test my-test.test.ts --reporter=verbose

# הרץ טסט אחד בלבד:
pnpm test my-test.test.ts -t "test name"

# נקה cache:
pnpm test --clearCache
```

### **בעיה: "Database connection failed" בטסטים**

```bash
# ודא שDocker רץ:
docker ps

# בדוק את .env.local:
cat .env.local | grep DATABASE_URL

# הרץ טסטים עם DATABASE_URL:
DATABASE_URL="mysql://..." pnpm test
```

### **בעיה: טסטים עוברים מקומית אבל נכשלים ב-CI**

```bash
# בדוק שאין תלות בסביבה:
# - אין קבצים מקומיים
# - אין תלות בזמן/תאריך
# - אין תלות בסדר הרצה

# הרץ טסטים בסדר אקראי:
pnpm test --random
```

---

## 🌐 בעיות שרת פיתוח

### **בעיה: "Port 3000 is already in use"**

```bash
# מצא מי משתמש בפורט:
lsof -i :3000

# הרוג את התהליך:
kill -9 <PID>

# או שנה את הפורט:
PORT=3001 pnpm dev
```

### **בעיה: "Cannot GET /"**

```bash
# בדוק שהשרת רץ:
pnpm dev

# בדוק את הלוגים:
# אמור לראות: "Server running on http://localhost:3000"

# בדוק שאין שגיאות TypeScript:
pnpm check
```

### **בעיה: שינויים לא מתעדכנים בדפדפן**

```bash
# נקה cache בדפדפן:
# Ctrl+Shift+R (Linux/Windows)
# Cmd+Shift+R (Mac)

# או הפעל מחדש את השרת:
# Ctrl+C
pnpm dev
```

---

## 🔐 בעיות OAuth

### **בעיה: "Redirect URI mismatch"**

```bash
# בדוק ב-Google Console:
# Authorized redirect URIs צריך לכלול:
# http://localhost:3000/auth/google/callback

# בדוק את .env.local:
cat .env.local | grep GOOGLE_CALLBACK_URL
# צריך להיות: http://localhost:3000/auth/google/callback
```

### **בעיה: "Invalid client"**

```bash
# בדוק את credentials ב-.env.local:
cat .env.local | grep GOOGLE_CLIENT

# ודא שהם תואמים ל-Google Console
```

---

## 📁 בעיות אחסון קבצים

### **בעיה: "Cannot upload file"**

```bash
# בדוק שתיקיית uploads קיימת:
ls -la uploads/

# אם לא, צור אותה:
mkdir -p uploads

# בדוק הרשאות:
chmod 755 uploads
```

### **בעיה: "File too large"**

```bash
# הגדל את max file size ב-server:
# server/_core/index.ts
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

---

## 🏗️ בעיות Build

### **בעיה: "Build failed"**

```bash
# בדוק שגיאות TypeScript:
pnpm check

# נקה dist:
rm -rf dist/
pnpm build

# בדוק שיש מספיק מקום:
df -h
```

### **בעיה: "Out of memory"**

```bash
# הגדל את heap size:
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

---

## 🚀 בעיות פרודקשן

### **בעיה: הפרודקשן לא מתעדכן**

```bash
# התחבר לשרת:
ssh user@your-server.com

# בדוק את Git:
cd /path/to/ruach-articles
git status
git log --oneline -5

# עדכן ידנית:
git pull origin main
pnpm install
pnpm build
pm2 restart ruach-articles
```

### **בעיה: שגיאות 500 בפרודקשן**

```bash
# בדוק לוגים:
pm2 logs ruach-articles

# או:
tail -f /var/log/ruach-articles/error.log

# בדוק שכל המשתנים ב-.env:
cat .env | grep -v "^#"
```

### **בעיה: האתר איטי**

```bash
# בדוק CPU/Memory:
top

# בדוק שאין queries איטיים:
# התחבר ל-MySQL ובדוק slow query log

# בדוק שיש index על טבלאות:
SHOW INDEX FROM articles;
```

---

## 🔍 כלי עזר לדיבאג

### **בדיקת סטטוס כללי:**

```bash
# Git:
git status
git branch
git log --oneline -5

# Docker:
docker ps
docker-compose logs

# Node:
node --version
pnpm --version

# Database:
docker exec -it ruach-mysql mysql -u root -p

# Disk space:
df -h

# Memory:
free -h
```

### **לוגים:**

```bash
# שרת פיתוח:
pnpm dev  # הלוגים יופיעו כאן

# Docker:
docker-compose logs -f mysql

# פרודקשן:
pm2 logs ruach-articles
```

---

## 💡 טיפים כלליים

1. **קרא את השגיאה** - רוב השגיאות מסבירות מה הבעיה
2. **גוגל את השגיאה** - רוב הבעיות כבר נפתרו
3. **בדוק את הלוגים** - הם מספרים הרבה
4. **נסה מחדש** - לפעמים זה עוזר
5. **שאל AI** - Cline יכול לעזור

---

## 🆘 אם כלום לא עוזר

1. **Rollback:**
   ```bash
   git checkout [last-working-commit]
   ```

2. **התקנה נקייה:**
   ```bash
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

3. **Docker מחדש:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

4. **שאל עזרה:**
   - בדוק את התיעוד
   - חפש בגוגל
   - שאל ב-Stack Overflow
   - שאל AI

---

## 📞 קבלת עזרה

### **מידע שימושי לשיתוף:**

```bash
# גרסאות:
node --version
pnpm --version
docker --version

# מערכת הפעלה:
uname -a

# שגיאה מדויקת:
# העתק את כל השגיאה, לא רק שורה אחת

# מה ניסית:
# תאר מה עשית לפני השגיאה
```

---

## 🔗 קישורים שימושיים

- **Git Workflow:** `01-GIT-WORKFLOW.md`
- **Daily Workflow:** `02-DAILY-WORKFLOW.md`
- **Deployment:** `03-DEPLOYMENT.md`
- **Stack Overflow:** `https://stackoverflow.com`
- **Docker Docs:** `https://docs.docker.com`

---

**עודכן:** מאי 2026  
**גרסה:** 1.0.0
