/**
 * שאלת המשך לקריאת טארוט — קבועים וטקסטים טהורים, משותפים לשרת וללקוח.
 * אחרי פירוש AI לפריסה אפשר לשאול עד MAX_FOLLOWUPS שאלות; לכל אחת נשלף קלף מבהיר אחד
 * ממה שנשאר בחפיסה (drawMore). השאלות אינן נספרות במכסה החודשית ואינן נשמרות.
 */
import type { SpreadKind } from "./spreads";

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
const SUGGESTIONS: Record<SpreadKind, readonly string[]> = {
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
};

export function followUpSuggestions(kind: SpreadKind): string[] {
  return [...(SUGGESTIONS[kind] ?? SUGGESTIONS.three)];
}
