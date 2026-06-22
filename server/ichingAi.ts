import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./_core/env";

export interface IchingAiContext {
  question: string;
  baseName: string;
  baseText: string;
  /** ריק כשהקריאה יציבה (אין קווים משתנים → אין הקסגרמה נגזרת). */
  resultName?: string;
  resultText?: string;
}

/** בונה את הפרומפט בגישת מא דווה פדמה. טהורה — בלי רשת, בלי env. */
export function buildIchingPrompt(c: IchingAiContext): string {
  const hasResult = !!(c.resultName && c.resultName.trim());
  const resultLine = hasResult
    ? `הקסגרמת תוצאה: "${c.resultName} — ${c.resultText ?? ""}"`
    : `הקסגרמת תוצאה: אין — זו קריאה יציבה ללא קווים משתנים.`;

  return [
    `אתה מומחה לאי צ'ינג בגישת מא דווה פדמה (Tao Oracle). תפקידך לתת פירוש פסיכולוגי, מעשי וישיר, בגובה העיניים ובלי לחלק מחמאות מיותרות.`,
    ``,
    `שאלת המשתמש: "${c.question}"`,
    `הקסגרמת בסיס: "${c.baseName} — ${c.baseText}"`,
    resultLine,
    ``,
    `בהתבסס אך ורק על הגישה המשתקפת בטקסטים אלו, נתח את המעבר בין ההקסגרמות בהקשר לשאלה הספציפית.`,
    `החזר את התשובה בעברית, בפורמט נקי ונוח לקריאה (Markdown), תוך שימוש בכותרות קצרות ובנקודות (bullet points).`,
  ].join("\n");
}

/** שגיאה חולפת (429 / 5xx / רשת) — שווה ניסיון חוזר. */
class RetryableError extends Error {}

/** ניסיון חוזר עם השהיה מצטברת (exponential backoff) על שגיאות חולפות בלבד. */
async function withRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (e: unknown) => boolean,
  attempts = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isRetryable(err)) break;
      await new Promise((r) => setTimeout(r, 600 * 2 ** i)); // 600ms, 1200ms…
    }
  }
  throw lastErr;
}

/** קריאה ל-DeepSeek דרך ה-endpoint התואם-OpenAI. */
async function generateWithDeepSeek(prompt: string): Promise<string> {
  const res = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      messages: [{ role: "user", content: prompt }],
      // 0.7 — טמפרטורה גבוהה (1.3) מפרקת את העברית של DeepSeek לג'יבריש; 0.7 שומר על קוהרנטיות.
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const msg = `DeepSeek ${res.status}: ${body.slice(0, 300)}`;
    if (res.status === 429 || res.status >= 500) throw new RetryableError(msg);
    throw new Error(msg);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = (data.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error("DeepSeek returned empty response");
  return text;
}

/** קריאה ל-Gemini (נתיב חלופי כשמגדירים ICHING_AI_PROVIDER=gemini). */
async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

/**
 * מייצר פירוש (Markdown) דרך הספק שנבחר ב-env. זורק אם אין מפתח / אם הקריאה נכשלה.
 * שגיאות חולפות (429/5xx/רשת) עוברות ניסיון חוזר עם backoff לפני שהן מתפשטות.
 */
export async function generateIchingInterpretation(c: IchingAiContext): Promise<string> {
  const prompt = buildIchingPrompt(c);

  if (env.ICHING_AI_PROVIDER === "gemini") {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    // שגיאות העומס של Gemini (429/503) מגיעות כ-throw מה-SDK → מנסים שוב על כולן.
    return withRetry(() => generateWithGemini(prompt), () => true);
  }

  if (!env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");
  return withRetry(
    () => generateWithDeepSeek(prompt),
    // ניסיון חוזר רק על שגיאות חולפות: 429/5xx (RetryableError) או תקלת רשת (TypeError).
    (e) => e instanceof RetryableError || e instanceof TypeError,
  );
}
