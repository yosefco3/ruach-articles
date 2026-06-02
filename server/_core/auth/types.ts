import type { Request } from 'express';

/**
 * Authenticated user shape used throughout the server.
 * Extracted from context.ts so auth logic and tRPC context can
 * share a single canonical type.
 */
export interface AuthUser {
  id: string; // OpenID for session identification
  dbId: number; // Numeric database ID for foreign keys
  email: string;
  name: string;
  avatar: string;
  role: 'admin' | 'user';
}

/**
 * Pluggable authentication service.
 *
 * The default implementation reads Passport's session user from Express,
 * but the interface allows swapping in JWT, API-key, or test-double
 * strategies without touching context creation or router middleware.
 */
export interface AuthService {
  /** Return the authenticated user (or null for anonymous). */
  getSession(req: Request): Promise<AuthUser | null>;

  /** Return the user or throw an UNAUTHORIZED error. */
  requireAuth(req: Request): Promise<AuthUser>;

  /** Return the user or throw a FORBIDDEN error if not admin. */
  requireAdmin(req: Request): Promise<AuthUser>;
}