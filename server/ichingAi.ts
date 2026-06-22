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

/** קורא ל-Gemini ומחזיר טקסט (Markdown). זורק אם אין מפתח / אם הקריאה נכשלה. */
export async function generateIchingInterpretation(c: IchingAiContext): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
  const result = await model.generateContent(buildIchingPrompt(c));
  const text = result.response.text().trim();
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}
