import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./_core/env";

export interface IchingAiContext {
  question: string;
  baseName: string;
  baseText: string;
  /** ריק כשהקריאה יציבה (אין קווים משתנים → אין הקסגרמה נגזרת). */
  resultName?: string;
  resultText?: string;
  /** קווים משתנים בקריאה זו (1=תחתון), רק כאלה עם טקסט. ריק → לא מוזרק. */
  changingLines?: { line: number; text: string }[];
}

/** בונה את הפרומפט בגישת מא דווה פדמה. טהורה — בלי רשת, בלי env. */
export function buildIchingPrompt(c: IchingAiContext): string {
  const hasResult = !!(c.resultName && c.resultName.trim());
  const resultLine = hasResult
    ? `הקסגרמת תוצאה: "${c.resultName} — ${c.resultText ?? ""}"`
    : `הקסגרמת תוצאה: אין — זו קריאה יציבה ללא קווים משתנים.`;

  const cl = c.changingLines ?? [];
  const changingBlock = cl.length
    ? [
        ``,
        `הסבר הקווים המשתנים בקריאה זו (קו 1 = הקו התחתון):`,
        ...cl.map((l) => `- קו ${l.line}: ${l.text}`),
      ]
    : [];

  return [
    `אתה מומחה לאי צ'ינג בגישת מא דווה פדמה (Tao Oracle). תפקידך לתת פירוש פסיכולוגי, מעשי וישיר, בגובה העיניים ובלי לחלק מחמאות מיותרות.`,
    ``,
    `שאלת המשתמש: "${c.question}"`,
    `הקסגרמת בסיס: "${c.baseName} — ${c.baseText}"`,
    resultLine,
    ...changingBlock,
    ``,
    `בהתבסס אך ורק על הגישה המשתקפת בטקסטים אלו, נתח את המעבר בין ההקסגרמות בהקשר לשאלה הספציפית${cl.length ? ", ושלב את משמעות הקווים המשתנים בניתוח" : ""}.`,
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
async function generateWithDeepSeek(prompt: string, maxTokens: number): Promise<string> {
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
      max_tokens: maxTokens,
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
 * קריאה גולמית לספק ה-AI שנבחר ב-env, עם ניסיון חוזר על שגיאות חולפות.
 * זורק אם אין מפתח / אם הקריאה נכשלה. `maxTokens` מבדיל בין פירוש ארוך לבדיקה זולה.
 */
async function callProvider(prompt: string, opts: { maxTokens: number }): Promise<string> {
  if (env.ICHING_AI_PROVIDER === "gemini") {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    // שגיאות העומס של Gemini (429/503) מגיעות כ-throw מה-SDK → מנסים שוב על כולן.
    return withRetry(() => generateWithGemini(prompt), () => true);
  }

  if (!env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");
  return withRetry(
    () => generateWithDeepSeek(prompt, opts.maxTokens),
    // ניסיון חוזר רק על שגיאות חולפות: 429/5xx (RetryableError) או תקלת רשת (TypeError).
    (e) => e instanceof RetryableError || e instanceof TypeError,
  );
}

/**
 * מייצר פירוש (Markdown) דרך הספק שנבחר ב-env. זורק אם אין מפתח / אם הקריאה נכשלה.
 * שגיאות חולפות (429/5xx/רשת) עוברות ניסיון חוזר עם backoff לפני שהן מתפשטות.
 */
export async function generateIchingInterpretation(c: IchingAiContext): Promise<string> {
  return callProvider(buildIchingPrompt(c), { maxTokens: 3000 });
}

/** תוצאת בדיקת השאלה לפני ההטלה: האם בעייתית בבירור, ועד שני ניסוחים חלופיים. */
export interface QuestionRefineResult {
  problematic: boolean;
  suggestions: string[];
}

/**
 * בונה פרומפט שמבקש מה-AI לשפוט אם שאלת המשתמש מתאימה לאי צ'ינג, ולהציע ניסוחים חלופיים.
 * הכללים נגזרים מהמאמר "איך נכתוב שאלה לאי צינג". טהורה — בלי רשת, בלי env.
 */
export function buildQuestionRefinePrompt(question: string): string {
  return [
    `אתה עוזר שמסייע לנסח שאלות לאי צ'ינג. האי צ'ינג מאיר תהליכים ואת איכות המצב ואת דרך הפעולה — לא תחזיות חד-משמעיות.`,
    ``,
    `שאלת המשתמש: "${question}"`,
    ``,
    `קבע אם השאלה בעייתית *בבירור* לפי הכללים הבאים (רק בעיה ברורה — לא ניואנס סגנוני):`,
    `- שאלת כן/לא (האם...).`,
    `- בקשת תחזית/ניחוש עתידי ("האם אזכה", "מתי אתחתן", "האם אמות").`,
    `- שאלה על מחשבותיו/מעשיו של אדם אחר ("מה בעלי חושב", "האם הוא בוגד").`,
    `- כמה שאלות שונות שנדחסו לאחת.`,
    `- בקשת אישור ("תגיד לי אם אני צודק").`,
    `- דבר שאינו בתחום ההשפעה של השואל ("האם הבוס יקדם אותי").`,
    `- שאלה מעורפלת מאוד או בלי מסגרת זמן כשהיא נחוצה.`,
    ``,
    `אם — ורק אם — השאלה בעייתית בבירור, נסח **שני** ניסוחים חלופיים שונים זה מזה (זוויות שונות),`,
    `שאלה אחת בלבד בכל ניסוח, בעברית, תוך שימור הנושא ומסגרת הזמן שהמשתמש נתן.`,
    `העדף פתיחות כמו: "מה נכון להבין...", "כיצד נכון לפעול...", "מהי הדינמיקה של...", "מה מתפתח במצב...", "ממה כדאי להיזהר...".`,
    ``,
    `החזר JSON תקין בלבד, ללא טקסט נוסף וללא סימוני קוד:`,
    `{"problematic": boolean, "suggestions": string[]}`,
    `כאשר problematic=false החזר suggestions ריק ([]); אחרת שני ניסוחים (אחד קביל אם אין שני ייחודי).`,
  ].join("\n");
}

/** מחלץ ומנקה את שדה suggestions מתשובת ה-AI: trim, השמטת ריקים, חיתוך ל-2. */
function cleanSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 2);
}

/**
 * בודק את שאלת המשתמש לפני ההטלה ומציע ניסוחים חלופיים אם היא בעייתית בבירור.
 * Fail-open לחלוטין: כל שגיאה / תשובה ריקה / JSON לא תקין / "בעייתי" בלי ניסוח שמיש
 * → {problematic:false, suggestions:[]}. הפונקציה לעולם לא זורקת — "לא בעייתי" = פשוט להטיל.
 */
export async function evaluateIchingQuestion(question: string): Promise<QuestionRefineResult> {
  const safe: QuestionRefineResult = { problematic: false, suggestions: [] };
  try {
    const text = await callProvider(buildQuestionRefinePrompt(question), { maxTokens: 500 });
    // מסירים גדר ```json``` או טקסט עוטף, ומחלצים את אובייקט ה-JSON.
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return safe;
    const parsed = JSON.parse(match[0]) as { problematic?: unknown; suggestions?: unknown };
    if (parsed.problematic !== true) return safe;
    const suggestions = cleanSuggestions(parsed.suggestions);
    if (suggestions.length === 0) return safe;
    return { problematic: true, suggestions };
  } catch {
    return safe;
  }
}
