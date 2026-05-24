# 🐳 פרומפט 01: הקמת MySQL ב-Docker

## 🎯 מטרה

הקמת MySQL 8.0 ב-Docker container לסביבת הפיתוח המקומית.

---

## 📋 סקירה

### **מה נעשה:**
1. יצירת `docker-compose.yml` עם MySQL 8.0
2. יצירת טסט לבדיקת חיבור ל-MySQL
3. הוספת `.gitignore` entries
4. הרצת Docker והרצת הטסט

### **מה לא נעשה:**
- ❌ לא יוצרים .env files (זה בפרומפט 02)
- ❌ לא משנים קוד קיים (רק מוסיפים קבצים)
- ❌ לא עובדים על storage (זה בפרומפט 03)

---

## 🔴 שלב 1: כתיבת טסטים (Red Phase)

### **יצירת קובץ טסט:**

**קובץ:** `server/docker-mysql.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import mysql from 'mysql2/promise';

describe('Docker MySQL Setup', () => {
  it('should connect to MySQL container', async () => {
    // Try to connect to MySQL
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

  it('should be able to create and query a test table', async () => {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'dev_password_2024',
      database: 'ruach_dev',
    });

    // Create test table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id INT PRIMARY KEY AUTO_INCREMENT,
        message VARCHAR(255)
      )
    `);

    // Insert test data
    await connection.query(
      'INSERT INTO test_connection (message) VALUES (?)',
      ['Docker MySQL is working!']
    );

    // Query test data
    const [rows] = await connection.query('SELECT * FROM test_connection');
    expect((rows as any[]).length).toBeGreaterThan(0);

    // Cleanup
    await connection.query('DROP TABLE test_connection');
    await connection.end();
  });
});
```

### **הרצת הטסט (צריך להיכשל):**

```bash
pnpm test docker-mysql.test.ts
```

**Expected Output:**
```
❌ FAIL  server/docker-mysql.test.ts
  ✕ should connect to MySQL container
    Error: connect ECONNREFUSED 127.0.0.1:3306
```

✅ **הטסט נכשל כמצופה** - אין עדיין MySQL container

---

## 🟢 שלב 2: שינויים בקוד (Green Phase)

### **2.1: יצירת docker-compose.yml**

**קובץ:** `docker-compose.yml` (בשורש הפרויקט)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: ruach-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: dev_password_2024
      MYSQL_DATABASE: ruach_dev
      MYSQL_CHARACTER_SET_SERVER: utf8mb4
      MYSQL_COLLATION_SERVER: utf8mb4_unicode_ci
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-pdev_password_2024"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:
    driver: local
```

### **2.2: עדכון .gitignore**

**קובץ:** `.gitignore`

הוסף בסוף הקובץ:

```gitignore
# Docker
docker-compose.override.yml

# Local development
.env.local
uploads/
```

### **2.3: הפעלת Docker**

```bash
# הפעל את MySQL container
docker-compose up -d

# בדוק שה-container רץ
docker ps

# בדוק לוגים
docker-compose logs mysql

# המתן ל-healthcheck (כ-30 שניות)
docker-compose ps
```

**Expected Output:**
```
NAME          IMAGE       STATUS                    PORTS
ruach-mysql   mysql:8.0   Up 30 seconds (healthy)   0.0.0.0:3306->3306/tcp
```

---

## 🔵 שלב 3: Refactor והרצת טסטים

### **3.1: הרץ את הטסט החדש**

```bash
pnpm test docker-mysql.test.ts
```

**Expected Output:**
```
✅ PASS  server/docker-mysql.test.ts
  ✓ should connect to MySQL container (45ms)
  ✓ should have ruach_dev database (12ms)
  ✓ should be able to create and query a test table (28ms)

Test Files  1 passed (1)
     Tests  3 passed (3)
```

### **3.2: הרץ את כל הטסטים**

```bash
pnpm test
```

**Expected Output:**
```
✅ PASS  server/docker-mysql.test.ts
✅ PASS  server/articles.test.ts
✅ PASS  server/contact.test.ts
... (all other tests)

Test Files  X passed (X)
     Tests  Y passed (Y)
```

✅ **כל הטסטים עוברים!**

---

## ✅ שלב 4: Validation

### **בדיקות סופיות:**

```bash
# 1. בדוק שDocker רץ
docker ps | grep ruach-mysql
# Expected: ruach-mysql   mysql:8.0   Up X minutes (healthy)

# 2. התחבר ל-MySQL ידנית
docker exec -it ruach-mysql mysql -u root -pdev_password_2024
# Expected: MySQL prompt
# הקלד: SHOW DATABASES;
# Expected: ruach_dev in list
# הקלד: exit

# 3. הרץ את כל הטסטים
pnpm test
# Expected: ✅ All tests pass

# 4. בדוק TypeScript
pnpm check
# Expected: ✅ No errors
```

---

## 🔙 Rollback Plan

אם משהו לא עובד:

### **אופציה 1: עצור את Docker**

```bash
docker-compose down
```

### **אופציה 2: מחק את הקבצים החדשים**

```bash
# מחק docker-compose.yml
rm docker-compose.yml

# מחק את הטסט
rm server/docker-mysql.test.ts

# החזר .gitignore למצב הקודם
git checkout .gitignore
```

### **אופציה 3: Rollback מלא**

```bash
git checkout .
docker-compose down -v  # מחק גם volumes
```

---

## 📝 Commit Message

```bash
git add docker-compose.yml server/docker-mysql.test.ts .gitignore
git commit -m "הוספתי Docker MySQL לסביבת פיתוח

- יצרתי docker-compose.yml עם MySQL 8.0
- הוספתי טסטים לבדיקת חיבור ל-MySQL
- עדכנתי .gitignore
- כל הטסטים עוברים ✅"
```

---

## 🎓 מה למדנו

1. **Docker Compose** - הגדרת MySQL container
2. **Healthcheck** - בדיקה שה-container מוכן
3. **Volumes** - שמירת נתונים בין הפעלות
4. **Testing** - בדיקת חיבור ל-database

---

## 🔗 הפרומפט הבא

**02-create-env-files.md** - יצירת קבצי .env לפיתוח ופרודקשן

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0  
**סטטוס:** ✅ מוכן לשימוש
