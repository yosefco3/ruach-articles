import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("about page imageUrl", () => {
  it("public users can read the about page", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const about = await caller.about.get();
    expect(about).toBeDefined();
    expect(about).toHaveProperty("title");
    expect(about).toHaveProperty("content");
  });

  it("about page response includes imageUrl field", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const about = await caller.about.get();
    // imageUrl should be present in the response (may be null)
    expect("imageUrl" in (about as object)).toBe(true);
  });

  it("admin can update about page with an imageUrl", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const testImageUrl = "https://example.com/test-image.jpg";

    const result = await caller.about.update({
      title: "אודות",
      content: "<p>תוכן בדיקה</p>",
      imageUrl: testImageUrl,
    });

    expect(result).toBeDefined();
    expect((result as any).imageUrl).toBe(testImageUrl);
  });

  it("admin can clear the imageUrl by omitting it", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.about.update({
      title: "אודות",
      content: "<p>תוכן בדיקה</p>",
    });

    expect(result).toBeDefined();
    // imageUrl should be null when not provided
    expect((result as any).imageUrl).toBeNull();
  });

  it("non-admin cannot update about page", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(
      caller.about.update({ title: "Hacked", content: "Hacked content" })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot update about page", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.about.update({ title: "Hacked", content: "Hacked content" })
    ).rejects.toThrow();
  });
});
