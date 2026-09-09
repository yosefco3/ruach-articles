import { generateText } from "./_core/aiProvider";

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

  const verdictHex = hasResult ? "הקסגרמת התוצאה (לאן הדברים נעים)" : "הקסגרמת הבסיס";

  return [
    `אתה מומחה לאי צ'ינג בגישת מא דווה פדמה (Tao Oracle). תפקידך לתת פירוש פסיכולוגי, מעשי וישיר, בגובה העיניים ובלי לחלק מחמאות מיותרות.`,
    ``,
    `שאלת המשתמש: "${c.question}"`,
    `הקסגרמת בסיס: "${c.baseName} — ${c.baseText}"`,
    resultLine,
    ...changingBlock,
    ``,
    `נתח את הקריאה בהקשר לשאלה הספציפית${cl.length ? ", ושלב את משמעות הקווים המשתנים בניתוח" : ""}, על פי המבנה הבא:`,
    ``,
    `1. **שורת הכרעה** בראש התשובה. סווג את המגמה שהקריאה מצביעה עליה ביחס לשאלה, ופתח במילה המודגשת המתאימה:`,
    `   - **כן** — אם הסימן נוטה לחיוב: הצלחה, פתיחות, תנועה מיטיבה, תמיכה.`,
    `   - **לא, ככל הנראה** — אם הסימן נוטה לשלילה: חסימה, אזהרה, נסיגה, קושי.`,
    `   - **מעורב — נוטה ל…** — רק אם הקריאה באמת מאוזנת; ציין לאיזה צד היא נוטה ובאיזה תנאי.`,
    `   בסס את ההכרעה בעיקר על ${verdictHex} בהקשר השאלה. אל תימנע מהכרעה — גם אם אינה ודאית, נקוט עמדה ברורה ("ככל הנראה").`,
    `2. **נימוק** קצר ולגופה של השאלה: למה זו ההכרעה ומה המשמעות המעשית.`,
    `3. **דרך פעולה** מומלצת בנקודות.`,
    ``,
    `הסתמך על הטקסטים שסופקו כבסיס לשיפוט בלבד — אל תצטט אותם ואל תיצמד לאוצר־המילים שלהם (למשל "קבלה", "הכלה"). תרגם את המשמעות לשפה ישירה הקשורה לשאלה.`,
    `החזר את התשובה בעברית, בפורמט נקי ונוח לקריאה (Markdown), תוך שימוש בכותרות קצרות ובנקודות (bullet points).`,
  ].join("\n");
}

/**
 * מייצר פירוש (Markdown) דרך הספק שנבחר ב-env. זורק אם אין מפתח / אם הקריאה נכשלה.
 * שגיאות חולפות (429/5xx/רשת) עוברות ניסיון חוזר עם backoff לפני שהן מתפשטות.
 */
export async function generateIchingInterpretation(c: IchingAiContext): Promise<string> {
  return generateText(buildIchingPrompt(c), { maxTokens: 3000 });
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
    const text = await generateText(buildQuestionRefinePrompt(question), { maxTokens: 500 });
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
