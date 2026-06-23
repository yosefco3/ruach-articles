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

  // Cloudflare R2 Storage (S3-compatible) — OPTIONAL in development
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

  // פירוש אי-צ'ינג מותאם-אישית — בחירת ספק ה-AI ('deepseek' כברירת מחדל)
  ICHING_AI_PROVIDER: z.enum(['deepseek', 'gemini']).default('deepseek'),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional(), // optional כדי לא להפיל את השרת בלי המפתח
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // DeepSeek AI (API תואם-OpenAI) — pay-per-use, ללא חסמי free-tier
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_MODEL: z.string().default('deepseek-chat'),
  DEEPSEEK_BASE_URL: z.string().default('https://api.deepseek.com'),
  // 0.7 שמרני — עברית של DeepSeek מתפרקת בטמפרטורות גבוהות (1.3 → ג'יבריש). ניתן לכוונן עד ~1.0.
  DEEPSEEK_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),

  ICHING_AI_MONTHLY_LIMIT: z.coerce.number().int().positive().default(5),
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
