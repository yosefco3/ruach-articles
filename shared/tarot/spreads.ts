/**
 * קטלוג הפריסות — מבנה טהור ומשותף לקליינט ולשרת.
 * ה-AI בוחר את הפריסה (kind + ניסוח האופציות); מכאן נגזרת "תוכנית": רשימת עמדות
 * עם תפקיד לכל אחת, בסדר השליפה. הקליינט פורס לפי התוכנית, השרת בונה ממנה את הפרומפט.
 *
 * - `three`  — השיטה הקיימת: קלף מרכזי (השני) נושא את התשובה, שני מסייעים לצדדיו.
 * - `choice` — שאלת בחירה בין 2–6 אופציות: קלף "הצומת" (מקומך עכשיו) → לכל אופציה שני
 *   קלפים באותם תפקידים ("מה הדרך מציעה", "לאן היא מובילה") → קלף סוגר "מה שאינך רואה".
 *   2 אופציות = 6 קלפים, 3 = 8, 4 = 10, 5 = 12, 6 = 14.
 *   (הורחב מ-4 ל-6 ב-2026-09-29, החלטת המשתמש: שני קלפים לכל אופציה גם ב-5 ו-6.)
 *   יותר מ-6 → שלושה קלפים, עם `overflow` כדי שהדף יסביר למה.
 *   לפריסת הבחירה שתי עמדות-שואל (`stance`, 2026-11-06, החלטת המשתמש):
 *   - `decision` (ברירת המחדל) — השואל עצמו בוחר בין דרכים ("לעבור או להישאר").
 *   - `outcome` — השואל שואל איזו מבין אפשרויות חיצוניות תתממש ("מי ירכיב ממשלה: X, Y או Z").
 *     אותו מבנה קלפים, ניסוח ניטרלי: "אפשרות" במקום "דרך", "מה בידה / לאן נוטה" במקום
 *     "מה מציעה / לאן מובילה".
 */

export type SpreadKind = "three" | "choice";
/** עמדת השואל בשאלת בחירה: בוחר בעצמו (decision) או צופה באפשרויות חיצוניות (outcome). */
export type SpreadStance = "decision" | "outcome";

/** מה שה-AI מחזיר (ומה שהקליינט שולח ל-interpret): סוג + ניסוח האופציות. */
export interface SpreadChoice {
  kind: SpreadKind;
  options: string[]; // ריק עבור three
  /**
   * עמדת השואל בשאלת בחירה. חסר = decision (תאימות לאחור לפריסות שנשמרו). נשמר גם על
   * three-עם-overflow, כדי שהודעת החריגה תדבר על "אפשרויות" ולא על "דרכים".
   */
  stance?: SpreadStance;
  /** כותרת קצרה לקריאה שה-AI מזקק מהשאלה — משמשת כשם קובץ בהדפסה/שמירה כ-PDF. */
  title?: string;
  /**
   * רק ב-three: כמה אפשרויות זוהו בשאלה כשהן חרגו מ-MAX_CHOICE_OPTIONS. בלי זה הדף
   * פורס שלושה קלפים בשתיקה, והשואל חושב שזו תקלה.
   */
  overflow?: number;
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
export const MAX_CHOICE_OPTIONS = 6;
/** כמה אפשרויות לכל היותר נספרות לצורך הודעת החריגה (מעבר לזה — המספר נחתך). */
export const MAX_COUNTED_OPTIONS = 12;
/** אורך מרבי לניסוח אופציה (ה-AI מתבקש לקצר; מעבר לזה — נחתך). */
export const MAX_OPTION_LENGTH = 60;
/** אורך מרבי לכותרת הקריאה (שם קובץ). */
export const MAX_TITLE_LENGTH = 60;

/** מנקה כותרת לשימוש כשם קובץ: בלי תווים אסורים / שורות, רווחים מכווצים, חיתוך. */
export function sanitizeReadingTitle(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE_LENGTH)
    .trim();
  return t.length >= 2 ? t : undefined;
}

const OPTION_LETTERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"];

/** אות עברית לאופציה: 0 → א׳ … 5 → ו׳ (מעבר לכך — מספר). */
export function optionLetter(i: number): string {
  return OPTION_LETTERS[i] ?? String(i + 1);
}

/** עמדת השואל של בחירה מנורמלת — `decision` כשלא צוין. */
export function spreadStance(choice: Pick<SpreadChoice, "stance">): SpreadStance {
  return choice.stance === "outcome" ? "outcome" : "decision";
}

/** שם העצם לאופציה בניסוח: "דרך" לבחירה אישית, "אפשרות" לאפשרויות חיצוניות. */
export function optionNoun(stance: SpreadStance, plural = false): string {
  if (stance === "outcome") return plural ? "אפשרויות" : "אפשרות";
  return plural ? "דרכים" : "דרך";
}

/** "דרך א׳" / "אפשרות ב׳" — שם האופציה בתצוגה ובפרומפט. */
export function optionName(stance: SpreadStance, i: number): string {
  return `${optionNoun(stance)} ${optionLetter(i)}`;
}

/**
 * מנרמל תשובת AI (או קלט לקוח) לבחירת פריסה תקינה. Fail-open: כל דבר שאינו
 * `choice` תקין עם 2–6 אופציות לא-ריקות → THREE_SPREAD. יותר מ-6 אפשרויות →
 * THREE_SPREAD עם `overflow` (מספר האפשרויות שזוהו), כדי שהדף יוכל להסביר.
 */
export function normalizeSpreadChoice(raw: unknown): SpreadChoice {
  if (!raw || typeof raw !== "object") return THREE_SPREAD;
  const r = raw as {
    kind?: unknown;
    options?: unknown;
    stance?: unknown;
    title?: unknown;
    overflow?: unknown;
  };
  const title = sanitizeReadingTitle(r.title);
  const three: SpreadChoice = title ? { ...THREE_SPREAD, title } : THREE_SPREAD;
  const outcome = r.stance === "outcome";
  const withOverflow = (count: number): SpreadChoice => ({
    ...three,
    overflow: Math.min(count, MAX_COUNTED_OPTIONS),
    ...(outcome ? { stance: "outcome" as const } : {}),
  });
  if (r.kind !== "choice") {
    // שחזור של בחירה שכבר נורמלה (למשל אחרי התחברות) — שומרים על הודעת החריגה (ועמדתה).
    const kept = r.overflow;
    return typeof kept === "number" && Number.isInteger(kept) && kept > MAX_CHOICE_OPTIONS
      ? withOverflow(kept)
      : three;
  }
  if (!Array.isArray(r.options)) return three;
  const options = r.options
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim().slice(0, MAX_OPTION_LENGTH).trim())
    .filter((o) => o.length > 0);
  if (options.length > MAX_CHOICE_OPTIONS) return withOverflow(options.length);
  if (options.length < MIN_CHOICE_OPTIONS) return three;
  const choice: SpreadChoice = { kind: "choice", options };
  // ערך לא מוכר (או חסר) = decision; לא כותבים אותו כדי לשמור על השוואות שוויון קיימות.
  if (outcome) choice.stance = "outcome";
  if (title) choice.title = title;
  return choice;
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
  const stance = spreadStance(choice);
  const positions: SpreadPosition[] =
    stance === "outcome"
      ? [
          {
            key: "now",
            label: "הַמַּצָּב",
            role: "המצב עכשיו — השדה שבו הדברים מוכרעים: מה מניע את התהליך, ומאיזה מקום השואל מביט בו",
          },
        ]
      : [{ key: "now", label: "הַצֹּמֶת", role: "מקומך עכשיו — מה מביא אותך לצומת הזה ומאיזה מקום אתה בוחר" }];
  choice.options.forEach((opt, i) => {
    const name = optionName(stance, i);
    if (stance === "outcome") {
      positions.push(
        {
          key: `opt${i}-offer`,
          label: "מָה בְּיָדָהּ",
          role: `${name} ("${opt}") — מה בידה: הכוחות שעומדים לרשותה, מה פועל לטובתה ומה מניע אותה`,
          option: i,
        },
        {
          key: `opt${i}-lead`,
          label: "לְאָן נוֹטָה",
          role: `${name} ("${opt}") — לאן היא נוטה: הכיוון הסביר, מה מקדם אותה ומה בולם אותה`,
          option: i,
        },
      );
      return;
    }
    positions.push(
      {
        key: `opt${i}-offer`,
        label: "מָה מַצִּיעָה",
        role: `${name} ("${opt}") — מה הדרך מציעה: הצד הגלוי, מה מושך אליה ומה היא נותנת`,
        option: i,
      },
      {
        key: `opt${i}-lead`,
        label: "לְאָן מוֹבִילָה",
        role: `${name} ("${opt}") — לאן הדרך מובילה: התוצאה הסבירה, כולל המחיר והדרישה`,
        option: i,
      },
    );
  });
  positions.push({
    key: "hidden",
    label: "מָה שֶׁאֵינְךָ רוֹאֶה",
    role:
      stance === "outcome"
        ? "מה שאינך רואה — גורם נסתר, תפנית, או אפשרות שלא עלתה בשאלה"
        : "מה שאינך רואה — עצה, גורם נסתר, או דרך שלישית שלא עלתה בשאלה",
  });
  const title =
    choice.options.length !== 2
      ? "פְּרִיסַת הַמְּנִיפָה"
      : stance === "outcome"
        ? "פְּרִיסַת שְׁתֵּי הָאֶפְשָׁרֻיּוֹת"
        : "פְּרִיסַת שְׁתֵּי הַדְּרָכִים";
  return { kind: "choice", options: choice.options, positions, title };
}

/** מספר הקלפים שיש לשלוף לתוכנית. */
export function spreadSize(choice: SpreadChoice): number {
  return spreadPlan(choice).positions.length;
}
