/**
 * Login URL — redirects to Google OAuth 2.0 via our own server endpoint.
 * After successful authentication the user is returned to the site with
 * an active session (Passport / express-session).
 * ברירת המחדל: חוזרים לדף שממנו התחברו (הנתיב הנוכחי, כולל query). אפשר
 * להעביר `returnTo` מפורש; השרת מוודא שזה נתיב פנימי בלבד (safeReturnTo).
 */
export const getLoginUrl = (returnTo?: string) => {
  const target =
    returnTo ??
    (typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "");
  return target ? `/api/auth/google?returnTo=${encodeURIComponent(target)}` : `/api/auth/google`;
};
