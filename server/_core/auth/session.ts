import type { Request } from 'express';
import { TRPCError } from '@trpc/server';
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import type { AuthUser, AuthService } from './types';

/**
 * Default AuthService implementation.
 *
 * Reads the authenticated user from Passport's express-session
 * (populated after OAuth callback).  This is the production strategy;
 * tests can swap in a stub via the AuthService interface.
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

export const passportAuthService: AuthService = {
  async getSession(req: Request): Promise<AuthUser | null> {
    return extractUser(req);
  },

  async requireAuth(req: Request): Promise<AuthUser> {
    const user = extractUser(req);
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: UNAUTHED_ERR_MSG });
    }
    return user;
  },

  async requireAdmin(req: Request): Promise<AuthUser> {
    const user = extractUser(req);
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: UNAUTHED_ERR_MSG });
    }
    if (user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: NOT_ADMIN_ERR_MSG });
    }
    return user;
  },
};