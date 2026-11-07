/**
 * אזור הכרזה למקראי מסך: הודעה קצרה על מצב הפירוש (בהכנה / מוכן / שגיאה), בלי להקריא את
 * הפירוש עצמו בכל קטע שמגיע. האלמנט נשאר תמיד ב-DOM — רק כך הטקסט שנכנס אליו מוכרז.
 */
export type AiStatusState = "idle" | "loading" | "done" | "error";

export const AI_LOADING_STATUS = "הפירוש בהכנה…";
export const AI_DONE_STATUS = "הפירוש מוכן";
export const AI_ERROR_STATUS = "אירעה שגיאה בקבלת הפירוש";

export function AiLiveStatus({
  state,
  errorText = AI_ERROR_STATUS,
}: {
  state: AiStatusState;
  errorText?: string;
}) {
  const text =
    state === "loading"
      ? AI_LOADING_STATUS
      : state === "done"
        ? AI_DONE_STATUS
        : state === "error"
          ? errorText
          : "";
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {text}
    </p>
  );
}
