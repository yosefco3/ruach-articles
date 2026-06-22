import { vi } from "vitest";
import { createAppRouter } from "../routers/index";
import type { RouterDeps } from "../routers/context";
import type { TrpcContext } from "../_core/context";
import type { AuthUser } from "../_core/auth/types";

/** A user with the REAL AuthUser shape (incl. dbId). Override any field. */
export function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "openid-1",
    dbId: 1,
    email: "user@example.com",
    name: "Test User",
    avatar: "",
    role: "user",
    ...overrides,
  };
}

function ctxWith(user: AuthUser | null): TrpcContext {
  const res = { clearCookie: () => {}, cookie: () => {} };
  const req = {
    protocol: "https",
    headers: {},
    logout: (cb: (err?: unknown) => void) => cb(),
    session: { destroy: (cb: (err?: unknown) => void) => cb() },
  };
  return { user, req: req as unknown as TrpcContext["req"], res: res as unknown as TrpcContext["res"] };
}

export const publicCtx = () => ctxWith(null);
export const userCtx = (o: Partial<AuthUser> = {}) => ctxWith(makeUser({ role: "user", ...o }));
export const adminCtx = (o: Partial<AuthUser> = {}) => ctxWith(makeUser({ role: "admin", dbId: 99, ...o }));

/** Approved guest writer: role 'user' + the guestPostApproved flag writerProcedure checks. */
export const writerCtx = (o: Partial<AuthUser> = {}) =>
  ctxWith({ ...makeUser({ role: "user", ...o }), guestPostApproved: true } as AuthUser);

/**
 * Build RouterDeps where every db method is a vi.fn(). A Proxy lazily creates a
 * vi.fn() for any method a router touches, so tests never need the full method list —
 * they pass overrides only for the methods whose return value matters.
 */
/** Non-db deps that some routers consume. Tests override only what they assert on. */
export interface ExtraDeps {
  generateIchingInterpretation?: (...args: unknown[]) => unknown;
  ichingAiMonthlyLimit?: number;
}

export function makeDeps(dbOverrides: Record<string, unknown> = {}, extra: ExtraDeps = {}) {
  // Wrap each override implementation in a vi.fn() so tests can assert call counts/args.
  const seeded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(dbOverrides)) {
    seeded[key] = typeof value === "function" ? vi.fn(value as (...args: unknown[]) => unknown) : value;
  }
  const db = new Proxy(seeded, {
    get(target, prop: string) {
      if (!(prop in target)) (target as Record<string, unknown>)[prop] = vi.fn();
      return (target as Record<string, unknown>)[prop];
    },
  });
  const sendArticleNewsletter = vi.fn().mockResolvedValue({ sent: 0, failed: 0 });
  const generateIchingInterpretation = vi.fn(
    extra.generateIchingInterpretation ?? (async () => "פירוש לדוגמה"),
  );
  const deps = {
    db,
    sendArticleNewsletter,
    generateIchingInterpretation,
    ichingAiMonthlyLimit: extra.ichingAiMonthlyLimit ?? 5,
  } as unknown as RouterDeps;
  return {
    deps,
    db: db as Record<string, ReturnType<typeof vi.fn>>,
    sendArticleNewsletter,
    generateIchingInterpretation,
  };
}

/** A tRPC caller for a given context + db overrides, plus the spies to assert on. */
export function makeCaller(
  ctx: TrpcContext,
  dbOverrides: Record<string, unknown> = {},
  extra: ExtraDeps = {},
) {
  const { deps, db, sendArticleNewsletter, generateIchingInterpretation } = makeDeps(dbOverrides, extra);
  const caller = createAppRouter(deps).createCaller(ctx);
  return { caller, db, sendArticleNewsletter, generateIchingInterpretation };
}
