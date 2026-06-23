import type { Request, Response } from 'express';
import type { AuthUser } from './auth/types';
import { getSession } from './auth/index';

/**
 * tRPC context. `ContextUser` is a backward-compatible alias for `AuthUser`.
 */
export type ContextUser = AuthUser;

export async function createContext({ req, res }: { req: Request; res: Response }) {
  const user = await getSession(req);
  return { req, res, user };
}

export type TrpcContext = Awaited<ReturnType<typeof createContext>>;