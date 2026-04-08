import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    guestPostApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createGuestWriterContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "guest-writer",
    email: "writer@example.com",
    name: "Guest Writer",
    loginMethod: "manus",
    role: "user",
    guestPostApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Phase 5: About Page & Guest Writers", () => {
  describe("about router", () => {
    it("should get about page content", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.about.get();
      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it("admin should update about page", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const newTitle = "אודות עדכן";
      const newContent = "<p>תוכן חדש</p>";

      const result = await caller.about.update({
        title: newTitle,
        content: newContent,
      });

      expect(result.title).toBe(newTitle);
      expect(result.content).toBe(newContent);
    });

    it("non-admin should not update about page", async () => {
      const { ctx } = createGuestWriterContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.about.update({
          title: "Unauthorized",
          content: "Should fail",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("guestWriters router", () => {
    it("admin should list approved guest writers", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.guestWriters.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("admin should approve a guest writer", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.guestWriters.approve({ userId: 2 });
      expect(result.success).toBe(true);
    });

    it("admin should revoke guest writer approval", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.guestWriters.revoke({ userId: 2 });
      expect(result.success).toBe(true);
    });

    it("non-admin cannot list guest writers", async () => {
      const { ctx } = createGuestWriterContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.guestWriters.list();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });

    it("non-admin cannot approve guest writers", async () => {
      const { ctx } = createGuestWriterContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.guestWriters.approve({ userId: 3 });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("site settings with dynamic name", () => {
    it("should get site settings", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.settings.get();
      expect(result).toBeDefined();
      expect(result.siteTitle).toBeDefined();
      expect(result.heroSubtitle).toBeDefined();
    });

    it("admin should update site settings", async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const newTitle = "אתר חדש";
      const newSubtitle = "תיאור חדש";

      const result = await caller.settings.update({
        siteTitle: newTitle,
        heroSubtitle: newSubtitle,
      });

      expect(result.siteTitle).toBe(newTitle);
      expect(result.heroSubtitle).toBe(newSubtitle);
    });

    it("non-admin should not update site settings", async () => {
      const { ctx } = createGuestWriterContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.settings.update({
          siteTitle: "Unauthorized",
          heroSubtitle: "Should fail",
        });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });
});
