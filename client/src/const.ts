/**
 * Login URL — redirects to Google OAuth 2.0 via our own server endpoint.
 * After successful authentication the user is returned to the site with
 * an active session (Passport / express-session).
 * `returnTo` (נתיב פנימי, למשל "/tarot") מחזיר את המשתמש לאותו דף אחרי
 * ההתחברות במקום לדף הבית — השרת מוודא שזה נתיב פנימי בלבד.
 */
export const getLoginUrl = (returnTo?: string) =>
  returnTo ? `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}` : `/api/auth/google`;
