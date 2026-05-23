export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Login URL — redirects to Google OAuth 2.0 via our own server endpoint.
 * After successful authentication the user is returned to the site with
 * an active session (Passport / express-session).
 */
export const getLoginUrl = () => `/api/auth/google`;