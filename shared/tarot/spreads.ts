/**
 * קטלוג הפריסות — מבנה טהור ומשותף לקליינט ולשרת.
 * ה-AI בוחר את הפריסה (kind + ניסוח האופציות); מכאן נגזרת "תוכנית": רשימת עמדות
 * עם תפקיד לכל אחת, בסדר השליפה. הקליינט פורס לפי התוכנית, השרת בונה ממנה את הפרומפט.
 *
 * - `three`  — השיטה הקיימת: קלף מרכזי (השני) נושא את התשובה, שני מסייעים לצדדיו.
 * - `choice` — שאלת בחירה בין 2–4 אופציות: קלף "הצומת" (מקומך עכשיו) → לכל אופציה שני
 *   קלפים באותם תפקידים ("מה הדרך מציעה", "לאן היא מובילה") → קלף סוגר "מה שאינך רואה".
 *   2 אופציות = 6 קלפים, 3 = 8, 4 = 10.
 */

export type SpreadKind = "three" | "choice";

/** מה שה-AI מחזיר (ומה שהקליינט שולח ל-interpret): סוג + ניסוח האופציות. */
export interface SpreadChoice {
  kind: SpreadKind;
  options: string[]; // ריק עבור three
}

export interface SpreadPosition {
  key: string;
  /** תווית קצרה מעל הקלף (מנוקדת, לתצוגה). */
  label: string;
  /** תפקיד העמדה בניסוח מלא — לפרומפט. */
  role: string;
  /** אינדקס האופציה (0-based) לעמדות שמשויכות לדרך; חסר לעמדות המשותפות. */
  option?: number;
}

export interface SpreadPlan {
  kind: SpreadKind;
  options: string[];
  positions: SpreadPosition[];
  /** שם הפריסה לתצוגה, למשל "פְּרִיסַת שְׁתֵּי הַדְּרָכִים". */
  title: string;
}

export const THREE_SPREAD: SpreadChoice = { kind: "three", options: [] };
export const MIN_CHOICE_OPTIONS = 2;
export const MAX_CHOICE_OPTIONS = 4;
/** אורך מרבי לניסוח אופציה (ה-AI מתבקש לקצר; מעבר לזה — נחתך). */
export const MAX_OPTION_LENGTH = 60;

const OPTION_LETTERS = ["א׳", "ב׳", "ג׳", "ד׳"];

/** אות עברית לאופציה: 0 → א׳ … 3 → ד׳ (מעבר לכך — מספר). */
export function optionLetter(i: number): string {
  return OPTION_LETTERS[i] ?? String(i + 1);
}

/**
 * מנרמל תשובת AI (או קלט לקוח) לבחירת פריסה תקינה. Fail-open: כל דבר שאינו
 * `choice` תקין עם 2–4 אופציות לא-ריקות → THREE_SPREAD.
 */
export function normalizeSpreadChoice(raw: unknown): SpreadChoice {
  if (!raw || typeof raw !== "object") return THREE_SPREAD;
  const r = raw as { kind?: unknown; options?: unknown };
  if (r.kind !== "choice") return THREE_SPREAD;
  if (!Array.isArray(r.options)) return THREE_SPREAD;
  const options = r.options
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim().slice(0, MAX_OPTION_LENGTH).trim())
    .filter((o) => o.length > 0);
  if (options.length < MIN_CHOICE_OPTIONS || options.length > MAX_CHOICE_OPTIONS) {
    return THREE_SPREAD;
  }
  return { kind: "choice", options };
}

const THREE_POSITIONS: SpreadPosition[] = [
  { key: "side-a", label: "קְלָף רִאשׁוֹן", role: "מסייע, לצד המרכזי" },
  { key: "center", label: "קְלָף שֵׁנִי", role: "הקלף המרכזי — נושא התשובה" },
  { key: "side-b", label: "קְלָף שְׁלִישִׁי", role: "מסייע, לצד המרכזי" },
];

/** בונה את תוכנית הפריסה מבחירה מנורמלת. */
export function spreadPlan(choice: SpreadChoice): SpreadPlan {
  if (choice.kind !== "choice") {
    return { kind: "three", options: [], positions: THREE_POSITIONS, title: "פְּרִיסַת שְׁלוֹשָׁה קְלָפִים" };
  }
  const positions: SpreadPosition[] = [
    { key: "now", label: "הַצֹּמֶת", role: "מקומך עכשיו — מה מביא אותך לצומת הזה ומאיזה מקום אתה בוחר" },
  ];
  choice.options.forEach((opt, i) => {
    const letter = optionLetter(i);
    positions.push(
      {
        key: `opt${i}-offer`,
        label: "מָה מַצִּיעָה",
        role: `דרך ${letter} ("${opt}") — מה הדרך מציעה: הצד הגלוי, מה מושך אליה ומה היא נותנת`,
        option: i,
      },
      {
        key: `opt${i}-lead`,
        label: "לְאָן מוֹבִילָה",
        role: `דרך ${letter} ("${opt}") — לאן הדרך מובילה: התוצאה הסבירה, כולל המחיר והדרישה`,
        option: i,
      },
    );
  });
  positions.push({
    key: "hidden",
    label: "מָה שֶׁאֵינְךָ רוֹאֶה",
    role: "מה שאינך רואה — עצה, גורם נסתר, או דרך שלישית שלא עלתה בשאלה",
  });
  const title = choice.options.length === 2 ? "פְּרִיסַת שְׁתֵּי הַדְּרָכִים" : "פְּרִיסַת הַמְּנִיפָה";
  return { kind: "choice", options: choice.options, positions, title };
}

/** מספר הקלפים שיש לשלוף לתוכנית. */
export function spreadSize(choice: SpreadChoice): number {
  return spreadPlan(choice).positions.length;
}
