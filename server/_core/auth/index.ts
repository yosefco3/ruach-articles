/**
 * Auth module — pluggable authentication service.
 *
 * Re-exports the AuthService interface, the default Passport-based
 * implementation, and the canonical AuthUser type.
 */
export { passportAuthService } from './session';
export type { AuthService, AuthUser } from './types';