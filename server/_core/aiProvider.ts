/**
 * שכבת ספק ה-AI המשותפת (חולצה מ-ichingAi.ts, ללא שינוי התנהגות) —
 * משרתת את האי-צ'ינג ואת הטארוט. בחירת ספק לפי env: DeepSeek (ברירת מחדל)
 * או Gemini; ניסיון חוזר עם backoff על שגיאות חולפות בלבד.
 * משתני ה-env נשארו בשמם ההיסטורי (ICHING_AI_PROVIDER וכו') — הם גלובליים לאתר.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env";
import { extractLastJsonObject } from "./json";

/** שגיאה חולפת (429 / 5xx / רשת) — שווה ניסיון חוזר. */
export class RetryableError extends Error {}

/** ניסיון חוזר עם השהיה מצטברת (exponential backoff) על שגיאות חולפות בלבד. */
export async function withRetry<T>(
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

/**
 * מרווח לטוקני חשיבה: במודלים חושבים (deepseek-v4-pro) ה-reasoning נספר בתוך
 * max_tokens, וחשיבה ארוכה עלולה לרוקן את תקציב התשובה ולהחזיר content ריק.
 * המרווח מתווסף בשכבה הזו כדי ש-maxTokens של הקוראים יישאר "תקציב תשובה".
 * נדיב בכוונה (החלטת 2026-09-10): המודל זול והחשיבה רצויה — שלא תיקטע.
 * הוגדל 4000→12000 (2026-09-10) אחרי מקרה אמת שבו חשיבה ארוכה קטעה פירוש
 * טארוט אחרי שורת המהות; finish_reason="length" נבדק עכשיו במפורש.
 * הוגדל 12000→20000 (2026-09-15) אחרי שפירוש פריסת בחירה (6 קלפים) נכשל בפרוד.
 */
const REASONING_HEADROOM = 20000;

export interface GenerateOptions {
  /** תקציב התשובה (בלי החשיבה — המרווח מתווסף כאן). */
  maxTokens: number;
  /**
   * למשימות קצרות שהפלט שלהן הוא אובייקט JSON (סיווג, בדיקת שאלה): המודל החושב מחזיר
   * לעיתים קרובות את התשובה בערוץ החשיבה ומשאיר את content ריק (finish_reason=stop).
   * כשהדגל דלוק, במקרה כזה מחולץ אובייקט ה-JSON האחרון מתוך החשיבה ומוחזר כתשובה.
   * לא לפירושים: שם החשיבה היא טיוטה פנימית שאסור להציג למשתמש.
   */
  jsonFromReasoning?: boolean;
}

/** קריאה ל-DeepSeek דרך ה-endpoint התואם-OpenAI. */
async function generateWithDeepSeek(prompt: string, opts: GenerateOptions): Promise<string> {
  const { maxTokens } = opts;
  const res = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      messages: [{ role: "user", content: prompt }],
      // ניתן לכוונן ב-env; ברירת מחדל 0.7 — טמפרטורה גבוהה (1.3) מפרקת את העברית של DeepSeek לג'יבריש.
      temperature: env.DEEPSEEK_TEMPERATURE,
      max_tokens: maxTokens + REASONING_HEADROOM,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const msg = `DeepSeek ${res.status}: ${body.slice(0, 300)}`;
    if (res.status === 429 || res.status >= 500) throw new RetryableError(msg);
    throw new Error(msg);
  }
  const data = (await res.json()) as {
    choices?: {
      message?: { content?: string; reasoning_content?: string };
      finish_reason?: string;
    }[];
  };
  const choice = data.choices?.[0];
  const message = choice?.message;
  const text = (message?.content ?? "").trim();
  if (choice?.finish_reason === "length") {
    // תקציב הטוקנים נגמר באמצע הפקה — התשובה קטועה (או ריקה). אורך החשיבה משתנה
    // בין ריצות, ולכן ניסיון חוזר סביר שיצליח; אסור להחזיר טקסט קטוע כהצלחה.
    throw new RetryableError(
      `DeepSeek hit max_tokens (finish_reason=length): reasoning=${(message?.reasoning_content ?? "").length} chars, content=${text.length} chars`,
    );
  }
  if (!text) {
    const reasoning = (message?.reasoning_content ?? "").trim();
    if (reasoning) {
      // finish_reason=stop עם content ריק: המודל סיים, אבל התשובה נשארה בערוץ החשיבה.
      // (זה לא מיצוי תקציב — מיצוי מגיע כ-finish_reason=length ומטופל למעלה.)
      // נמדד 2026-09-29: כמחצית מקריאות הסיווג הקצרות חוזרות כך.
      if (opts.jsonFromReasoning) {
        const json = extractLastJsonObject(reasoning);
        if (json) return json;
      }
      // הרצה נוספת לרוב מחזירה content — שווה ניסיון חוזר.
      throw new RetryableError(
        `DeepSeek returned empty content; the answer stayed in the reasoning channel (${reasoning.length} chars)`,
      );
    }
    throw new Error("DeepSeek returned empty response");
  }
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
 * קריאה גולמית לספק ה-AI שנבחר ב-env, עם ניסיון חוזר על שגיאות חולפות.
 * זורק אם אין מפתח / אם הקריאה נכשלה. `maxTokens` מבדיל בין פירוש ארוך לבדיקה זולה.
 */
export async function generateText(prompt: string, opts: GenerateOptions): Promise<string> {
  if (env.ICHING_AI_PROVIDER === "gemini") {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    // שגיאות העומס של Gemini (429/503) מגיעות כ-throw מה-SDK → מנסים שוב על כולן.
    return withRetry(() => generateWithGemini(prompt), () => true);
  }

  if (!env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");
  return withRetry(
    () => generateWithDeepSeek(prompt, opts),
    // ניסיון חוזר רק על שגיאות חולפות: 429/5xx (RetryableError) או תקלת רשת (TypeError).
    (e) => e instanceof RetryableError || e instanceof TypeError,
  );
}
