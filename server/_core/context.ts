import type { Request, Response } from 'express';

/**
 * tRPC context — reads the authenticated user from Passport's express-session.
 * Replaces the old Manus session / SDK-based context.
 *
 * The `role` field is set to "admin" when the user's email matches ADMIN_EMAIL
 * (handled in oauth.ts during Google login).
 */

export interface ContextUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'admin' | 'user';
}

export function createContext({ req, res }: { req: Request; res: Response }) {
  // Passport stores the serialised user object on req.user after session deserialization
  const sessionUser = (req as any).user as ContextUser | undefined;

  const user: ContextUser | null =
    sessionUser && sessionUser.email
      ? {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name ?? '',
          avatar: sessionUser.avatar ?? '',
          role: sessionUser.role ?? 'user',
        }
      : null;

  return { req, res, user };
}

export type Context = ReturnType<typeof createContext>;