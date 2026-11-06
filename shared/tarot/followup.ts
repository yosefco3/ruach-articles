/**
 * שאלת המשך לקריאת טארוט — קבועים וטקסטים טהורים, משותפים לשרת וללקוח.
 * אחרי פירוש AI לפריסה אפשר לשאול עד MAX_FOLLOWUPS שאלות; לכל אחת נשלף קלף מבהיר אחד
 * ממה שנשאר בחפיסה (drawMore). השאלות אינן נספרות במכסה החודשית ואינן נשמרות.
 */
import type { SpreadKind, SpreadStance } from "./spreads";

/** כמה שאלות המשך מותרות לקריאה אחת. */
export const MAX_FOLLOWUPS = 2;
/** אורך מרבי לשאלת המשך (קצרה משאלה ראשית — היא נשענת על הקשר קיים). */
export const MAX_FOLLOWUP_LENGTH = 300;
/** אורך מרבי לפירוש/תשובה קודמים שנשלחים חזרה כהקשר. */
export const MAX_CONTEXT_TEXT_LENGTH = 20_000;

/** "נותרו 2 שאלות המשך" / "נותרה שאלת המשך אחת" / "" כשלא נותרו. */
export function followUpsLeftLabel(left: number): string {
  if (!Number.isFinite(left) || left <= 0) return "";
  const n = Math.floor(left);
  return n === 1 ? "נותרה שאלת המשך אחת" : `נותרו ${n} שאלות המשך`;
}

/**
 * שאלות מוצעות (תגיות) לפי סוג הפריסה. לחיצה ממלאת את שדה השאלה ואינה שולחת.
 * בכוונה אין כאן שאלת "מתי" בתאריכים — שאלות זמן נענות כבשלות וקצב.
 */
const SUGGESTIONS: Record<SpreadKind | "outcome", readonly string[]> = {
  three: [
    "מה הצעד הראשון שנכון לעשות?",
    "מה מעכב אותי כאן?",
    "מה אני לא רואה במצב הזה?",
    "לפעול עכשיו או להמתין?",
  ],
  choice: [
    "מה חשוב לבדוק לפני שמכריעים?",
    "מה יעזור לי להכריע?",
    "איזה מחיר קשה לי לשלם?",
    "להכריע עכשיו או להמתין?",
  ],
  // פריסת בחירה בעמדת outcome ("מי/מה מבין כמה"): ההכרעה אינה בידי השואל.
  outcome: [
    "אחרי מה כדאי לי לעקוב?",
    "מה יכול לשנות את הכיוון?",
    "מה זה אומר עבורי?",
    "מה לא עלה בשאלה?",
  ],
};

/** שאלות מוצעות לפריסה; לפריסת בחירה בעמדת outcome — רשימה ניטרלית (אין מה "להכריע"). */
export function followUpSuggestions(kind: SpreadKind, stance?: SpreadStance): string[] {
  const key = kind === "choice" && stance === "outcome" ? "outcome" : kind;
  return [...(SUGGESTIONS[key] ?? SUGGESTIONS.three)];
}
