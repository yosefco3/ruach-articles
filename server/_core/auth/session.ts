import type { Request } from 'express';
import type { AuthUser } from './types';

/**
 * Reads the authenticated user from Passport's express-session
 * (populated after OAuth callback).
 */

function extractUser(req: Request): AuthUser | null {
  // Passport stores the serialised user object on req.user after session deserialization
  const sessionUser = (req as any).user as AuthUser | undefined;

  return sessionUser && sessionUser.email
    ? {
        id: sessionUser.id,
        dbId: sessionUser.dbId,
        email: sessionUser.email,
        name: sessionUser.name ?? '',
        avatar: sessionUser.avatar ?? '',
        role: sessionUser.role ?? 'user',
      }
    : null;
}

/** Resolve the authenticated user from the Passport session (null = anonymous). */
export async function getSession(req: Request): Promise<AuthUser | null> {
  return extractUser(req);
}