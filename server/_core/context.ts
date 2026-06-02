import type { Request, Response } from 'express';
import type { AuthUser } from './auth/types';
import { passportAuthService } from './auth/index';

/**
 * tRPC context — delegates user resolution to the AuthService.
 *
 * `ContextUser` is a backward-compatible alias for `AuthUser`.
 * The actual session extraction is handled by `passportAuthService`,
 * making it swappable in tests via the AuthService interface.
 */
export type ContextUser = AuthUser;

/**
 * Active AuthService instance.  Swap this in tests or future integrations.
 * Defaults to the Passport session-based implementation.
 */
export let authService = passportAuthService;

/** Replace the active auth service (useful in tests). */
export function setAuthService(service: typeof authService) {
  authService = service;
}

export async function createContext({ req, res }: { req: Request; res: Response }) {
  const user = await authService.getSession(req);
  return { req, res, user };
}

export type TrpcContext = Awaited<ReturnType<typeof createContext>>;