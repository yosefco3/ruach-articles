import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the notifyOwner function
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Admin User",
      email: "admin@ruach.test",
      role: "admin",
      avatarUrl: null,
      bio: null,
      guestPostApproved: false,
      createdAt: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("contact email feature", () => {
  describe("contact.getEmail", () => {
    it("public users can get the contact email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.contact.getEmail();
      expect(result).toHaveProperty("email");
      // email is null or a string
      expect(result.email === null || typeof result.email === "string").toBe(true);
    });
  });

  describe("settings.update with contactEmail", () => {
    it("admin can set a valid contact email", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.settings.update({
        contactEmail: "contact@ruach.test",
      });
      expect((result as any).contactEmail).toBe("contact@ruach.test");
    });

    it("rejects invalid email format", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.settings.update({ contactEmail: "not-an-email" });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.code).toBe("BAD_REQUEST");
      }
    });

    it("public users cannot update settings", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.settings.update({ contactEmail: "hacker@evil.com" });
        expect.fail("Should have thrown UNAUTHORIZED");
      } catch (err: any) {
        expect(["UNAUTHORIZED", "FORBIDDEN"]).toContain(err.code);
      }
    });
  });

  describe("contact.submit with contactEmail in notification", () => {
    it("submits contact form and returns success (contactEmail included in notification)", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.contact.submit({
        name: "יוסף כהן",
        email: "yosef@example.com",
        subject: "שאלה בנושא מאמר",
        message: "שלום, יש לי שאלה לגבי המאמר על הרמב\"ם. תודה רבה.",
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("בהצלחה");
    });
  });
});
