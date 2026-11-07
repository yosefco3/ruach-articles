export const LEGACY_QUESTION_HINT = "השאלה אישית ואינה נשמרת בשום מקום.";
export const DEFAULT_QUESTION_HINT =
  "השאלה נשלחת לספק בינה מלאכותית חיצוני לכתיבת הפירוש ואינה נשמרת באתר. אל תכתבו בה פרטים מזהים.";

/** ממפה את הנוסח הישן (שגוי) שנשמר ב-DB לברירת המחדל החדשה; כל טקסט אחר עובר כמות שהוא. */
export function normalizeQuestionHint<T extends { questionHint?: string | null }>(row: T): T {
  return row.questionHint === LEGACY_QUESTION_HINT ? { ...row, questionHint: DEFAULT_QUESTION_HINT } : row;
}
