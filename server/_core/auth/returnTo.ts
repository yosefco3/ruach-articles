/**
 * ולידציה של יעד החזרה אחרי OAuth — מונע open-redirect: מותר רק נתיב פנימי
 * שמתחיל ב-"/" בודד (לא "//host" ולא "/\host" ולא URL מלא).
 */
export function safeReturnTo(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 500) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}
