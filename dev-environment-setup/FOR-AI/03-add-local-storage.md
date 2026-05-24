# 💾 פרומפט 03: תמיכה באחסון מקומי

## 🎯 מטרה

הוספת תמיכה באחסון מקומי (local filesystem) לסביבת פיתוח, במקום Cloudflare R2.

---

## 📋 סקירה

### **מה נעשה:**
1. שינוי `server/_core/env.ts` - הפיכת R2 variables ל-optional
2. שינוי `server/storage.ts` - תמיכה ב-local storage
3. יצירת טסט לבדיקת אחסון מקומי
4. יצירת תיקיית `uploads/`

### **מה לא נעשה:**
- ❌ לא משנים את ה-API של storage (uploadFile, downloadFile וכו')
- ❌ לא עובדים על OAuth (זה בפרומפט 04)
- ❌ לא משנים קוד שמשתמש ב-storage (הוא ימשיך לעבוד)

---

## 🔴 שלב 1: כתיבת טסטים (Red Phase)

### **יצירת קובץ טסט:**

**קובץ:** `server/local-storage.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { uploadFile, downloadFile, getPublicUrl } from './storage';

describe('Local Storage Support', () => {
  const testDir = path.join(__dirname, '..', 'uploads', 'test');
  const testFilePath = path.join(testDir, 'test-file.txt');
  const testContent = 'Hello from local storage!';

  beforeAll(() => {
    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    // Create test file
    fs.writeFileSync(testFilePath, testContent);
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should upload file to local storage', async () => {
    const remoteKey = 'test/uploaded-file.txt';
    const url = await uploadFile(testFilePath, remoteKey, 'text/plain');

    expect(url).toBeDefined();
    expect(url).toContain(remoteKey);

    // Verify file exists in uploads directory
    const uploadedPath = path.join(__dirname, '..', 'uploads', remoteKey);
    expect(fs.existsSync(uploadedPath)).toBe(true);

    // Cleanup
    fs.unlinkSync(uploadedPath);
  });

  it('should download file from local storage', async () => {
    // First upload a file
    const remoteKey = 'test/download-test.txt';
    await uploadFile(testFilePath, remoteKey, 'text/plain');

    // Then download it
    const downloadPath = path.join(testDir, 'downloaded.txt');
    await downloadFile(remoteKey, downloadPath);

    expect(fs.existsSync(downloadPath)).toBe(true);
    const content = fs.readFileSync(downloadPath, 'utf-8');
    expect(content).toBe(testContent);

    // Cleanup
    fs.unlinkSync(downloadPath);
    const uploadedPath = path.join(__dirname, '..', 'uploads', remoteKey);
    fs.unlinkSync(uploadedPath);
  });

  it('should generate correct public URL for local files', () => {
    const remoteKey = 'images/test.jpg';
    const url = getPublicUrl(remoteKey);

    expect(url).toBeDefined();
    expect(url).toContain(remoteKey);
    // In development, should be a local URL
    expect(url).toMatch(/^(http:\/\/localhost|\/uploads)/);
  });

  it('should handle nested directories', async () => {
    const remoteKey = 'deep/nested/path/file.txt';
    const url = await uploadFile(testFilePath, remoteKey, 'text/plain');

    expect(url).toBeDefined();

    const uploadedPath = path.join(__dirname, '..', 'uploads', remoteKey);
    expect(fs.existsSync(uploadedPath)).toBe(true);

    // Cleanup
    fs.unlinkSync(uploadedPath);
    // Clean up directories
    const dirs = ['deep/nested/path', 'deep/nested', 'deep'];
    dirs.forEach(dir => {
      const dirPath = path.join(__dirname, '..', 'uploads', dir);
      if (fs.existsSync(dirPath)) {
        fs.rmdirSync(dirPath);
      }
    });
  });
});
```

### **הרצת הטסט (צריך להיכשל):**

```bash
pnpm test local-storage.test.ts
```

**Expected Output:**
```
❌ FAIL  server/local-storage.test.ts
  ✕ should upload file to local storage
    Error: R2_ENDPOINT is required
```

✅ **הטסט נכשל כמצופה** - הקוד עדיין דורש R2

---

## 🟢 שלב 2: שינויים בקוד (Green Phase)

### **2.1: עדכון server/_core/env.ts**

**קובץ:** `server/_core/env.ts`

```typescript
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().min(1),

  // Google OAuth 2.0
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().min(1),

  // JWT / Session
  JWT_SECRET: z.string().min(16),
  ADMIN_EMAIL: z.string().email(),

  // Cloudflare R2 Storage (S3-compatible) - OPTIONAL in development
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  // Email (Resend) — optional
  RESEND_API_KEY: z.string().optional(),

  // Google Maps — optional
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // OpenAI — optional
  OPENAI_API_KEY: z.string().optional(),

  // Contact form recipient — optional
  CONTACT_EMAIL_TO: z.string().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();

export type Env = z.infer<typeof envSchema>;

// Helper to check if R2 is configured
export function isR2Configured(): boolean {
  return !!(
    env.R2_ENDPOINT &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET &&
    env.R2_PUBLIC_URL
  );
}
```

### **2.2: עדכון server/storage.ts**

**קובץ:** `server/storage.ts`

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createReadStream } from "fs";
import { env, isR2Configured } from "./_core/env";

/**
 * Storage abstraction that supports both:
 * - Cloudflare R2 (production)
 * - Local filesystem (development)
 */

const STORAGE_MODE = isR2Configured() ? 'r2' : 'local';
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists in local mode
if (STORAGE_MODE === 'local' && !fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

// ────────────────────────────────────────
// R2 Client (only if configured)
// ────────────────────────────────────────

function createR2Client(): S3Client {
  if (!isR2Configured()) {
    throw new Error('R2 is not configured');
  }
  return new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

// ────────────────────────────────────────
// Public URL Helper
// ────────────────────────────────────────

export function getPublicUrl(key: string): string {
  if (STORAGE_MODE === 'r2') {
    const base = env.R2_PUBLIC_URL!.replace(/\/+$/, "");
    return `${base}/${key}`;
  } else {
    // Local mode: return relative URL
    return `/uploads/${key}`;
  }
}

// ────────────────────────────────────────
// Upload File
// ────────────────────────────────────────

export async function uploadFile(
  localFilePath: string,
  remoteKey: string,
  contentType?: string,
): Promise<string> {
  if (STORAGE_MODE === 'r2') {
    // R2 upload
    const client = createR2Client();
    const bucket = env.R2_BUCKET!;
    const fileStream = createReadStream(localFilePath);
    const stats = fs.statSync(localFilePath);

    const upload = new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: remoteKey,
        Body: fileStream,
        ContentType: contentType || "application/octet-stream",
        ContentLength: stats.size,
      },
    });

    await upload.done();
    return getPublicUrl(remoteKey);
  } else {
    // Local filesystem upload
    const destPath = path.join(LOCAL_UPLOADS_DIR, remoteKey);
    const destDir = path.dirname(destPath);

    // Ensure directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(localFilePath, destPath);
    return getPublicUrl(remoteKey);
  }
}

// ────────────────────────────────────────
// Upload Buffer
// ────────────────────────────────────────

export async function uploadBuffer(
  buffer: Buffer,
  remoteKey: string,
  contentType?: string,
): Promise<string> {
  if (STORAGE_MODE === 'r2') {
    // R2 upload
    const client = createR2Client();
    const bucket = env.R2_BUCKET!;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: remoteKey,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
      }),
    );

    return getPublicUrl(remoteKey);
  } else {
    // Local filesystem upload
    const destPath = path.join(LOCAL_UPLOADS_DIR, remoteKey);
    const destDir = path.dirname(destPath);

    // Ensure directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Write buffer to file
    fs.writeFileSync(destPath, buffer);
    return getPublicUrl(remoteKey);
  }
}

// ────────────────────────────────────────
// Download File
// ────────────────────────────────────────

export async function downloadFile(
  remoteKey: string,
  localFilePath: string,
): Promise<void> {
  if (STORAGE_MODE === 'r2') {
    // R2 download
    const client = createR2Client();
    const bucket = env.R2_BUCKET!;

    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: remoteKey,
      }),
    );

    if (!response.Body) {
      throw new Error(`Empty response body for key: ${remoteKey}`);
    }

    // Ensure directory exists
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // @ts-expect-error – Body is a ReadableStream in Node
    await pipeline(response.Body as NodeJS.ReadableStream, fs.createWriteStream(localFilePath));
  } else {
    // Local filesystem download (copy)
    const sourcePath = path.join(LOCAL_UPLOADS_DIR, remoteKey);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`File not found: ${remoteKey}`);
    }

    // Ensure destination directory exists
    const destDir = path.dirname(localFilePath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(sourcePath, localFilePath);
  }
}

// ────────────────────────────────────────
// Presigned URL (R2 only)
// ────────────────────────────────────────

export async function getPresignedUrl(
  remoteKey: string,
  expiresInSeconds = 3600,
): Promise<string> {
  if (STORAGE_MODE === 'r2') {
    const client = createR2Client();
    const bucket = env.R2_BUCKET!;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: remoteKey,
    });

    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } else {
    // Local mode: just return public URL (no signing needed)
    return getPublicUrl(remoteKey);
  }
}

// ────────────────────────────────────────
// Legacy compatibility
// ────────────────────────────────────────

export { createR2Client as createS3Client };

export function getBucket(): string {
  if (STORAGE_MODE === 'r2') {
    return env.R2_BUCKET!;
  } else {
    return 'local';
  }
}

// Export storage mode for debugging
export function getStorageMode(): 'r2' | 'local' {
  return STORAGE_MODE;
}
```

### **2.3: יצירת תיקיית uploads**

```bash
mkdir -p uploads
```

### **2.4: עדכון .gitignore**

ודא שיש:

```gitignore
# Local development
uploads/
```

---

## 🔵 שלב 3: Refactor והרצת טסטים

### **3.1: הרץ את הטסט החדש**

```bash
pnpm test local-storage.test.ts
```

**Expected Output:**
```
✅ PASS  server/local-storage.test.ts
  ✓ should upload file to local storage (15ms)
  ✓ should download file from local storage (12ms)
  ✓ should generate correct public URL for local files (2ms)
  ✓ should handle nested directories (18ms)

Test Files  1 passed (1)
     Tests  4 passed (4)
```

### **3.2: הרץ את כל הטסטים**

```bash
pnpm test
```

**Expected Output:**
```
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
# 1. בדוק שתיקיית uploads קיימת
ls -la uploads/
# Expected: Directory exists

# 2. בדוק שהיא ב-.gitignore
git status
# Expected: uploads/ should NOT appear

# 3. הרץ את כל הטסטים
pnpm test
# Expected: ✅ All tests pass

# 4. בדוק TypeScript
pnpm check
# Expected: ✅ No errors

# 5. בדוק את storage mode
node -e "const {getStorageMode} = require('./server/storage.ts'); console.log('Storage mode:', getStorageMode());"
# Expected: Storage mode: local
```

---

## 🔙 Rollback Plan

אם משהו לא עובד:

### **אופציה 1: החזר את הקבצים**

```bash
# החזר env.ts
git checkout server/_core/env.ts

# החזר storage.ts
git checkout server/storage.ts

# מחק את הטסט
rm server/local-storage.test.ts

# מחק uploads (אופציונלי)
rm -rf uploads/
```

### **אופציה 2: Rollback מלא**

```bash
git checkout .
rm -rf uploads/
```

---

## 📝 Commit Message

```bash
git add server/_core/env.ts server/storage.ts server/local-storage.test.ts .gitignore
git commit -m "הוספתי תמיכה באחסון מקומי לפיתוח

- שיניתי env.ts - R2 variables הפכו ל-optional
- שיניתי storage.ts - תמיכה ב-local filesystem
- הוספתי טסטים לבדיקת אחסון מקומי
- יצרתי תיקיית uploads/ (ignored)
- כל הטסטים עוברים ✅

Storage mode: local (development) / r2 (production)"
```

---

## 🎓 מה למדנו

1. **Storage Abstraction** - תמיכה ב-2 backends (R2 + local)
2. **Environment Detection** - בדיקה אוטומטית של R2 configuration
3. **Filesystem Operations** - יצירת directories, העתקת קבצים
4. **Backward Compatibility** - ה-API נשאר זהה

---

## 🔗 הפרומפט הבא

**04-update-oauth-config.md** - הגדרת OAuth ל-localhost

---

**נוצר:** מאי 2026  
**גרסה:** 1.0.0  
**סטטוס:** ✅ מוכן לשימוש
