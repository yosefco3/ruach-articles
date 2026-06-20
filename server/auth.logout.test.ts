import { describe, expect, it } from "vitest";
import { appRouter } from "./routers/index";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): {
  ctx: TrpcContext;
  clearedCookies: CookieCall[];
  calls: { logout: boolean; destroy: boolean };
} {
  const clearedCookies: CookieCall[] = [];
  const calls = { logout: false, destroy: false };

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      // Passport attaches logout(); the router calls it to clear the login session.
      logout: (cb: (err?: unknown) => void) => {
        calls.logout = true;
        cb();
      },
      session: {
        destroy: (cb: (err?: unknown) => void) => {
          calls.destroy = true;
          cb();
        },
      },
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies, calls };
}

describe("auth.logout", () => {
  it("logs out, destroys the session, clears the cookie and reports success", async () => {
    const { ctx, clearedCookies, calls } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });

    // Passport logout + session teardown both ran.
    expect(calls.logout).toBe(true);
    expect(calls.destroy).toBe(true);

    // The session cookie is cleared with the same flags the session uses.
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe("connect.sid");
    expect(clearedCookies[0]?.options).toMatchObject({
      path: "/",
      httpOnly: true,
      secure: false, // NODE_ENV !== "production" in tests
      sameSite: "lax",
    });
  });
});
