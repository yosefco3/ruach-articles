/**
 * Auth module — Passport session-based user resolution.
 *
 * Re-exports the session reader and the canonical AuthUser type.
 */
export { getSession } from './session';
export type { AuthUser } from './types';