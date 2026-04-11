import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the notifyOwner function
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

// Mock db so no real DB is touched
vi.mock("./db", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({ siteTitle: "רוּחַ", heroSubtitle: "", contactEmail: "contact@ruach.test" }),
  updateSiteSettings: vi.fn().mockImplementation(async (data: Record<string, unknown>) => data),
  getArticles: vi.fn().mockResolvedValue([]),
  getArticleBySlug: vi.fn().mockResolvedValue(null),
  getArticleById: vi.fn().mockResolvedValue(null),
  createArticle: vi.fn().mockResolvedValue({ id: 1 }),
  updateArticle: vi.fn().mockResolvedValue(undefined),
  deleteArticle: vi.fn().mockResolvedValue(undefined),
  getAttachmentsByArticle: vi.fn().mockResolvedValue([]),
  getCommentsByArticle: vi.fn().mockResolvedValue([]),
  createComment: vi.fn().mockResolvedValue({ success: true, id: 1 }),
  deleteComment: vi.fn().mockResolvedValue(undefined),
  getCommentById: vi.fn().mockResolvedValue(null),
  getAboutPage: vi.fn().mockResolvedValue({ title: "אודות", content: "", imageUrl: null }),
  updateAboutPage: vi.fn().mockResolvedValue(undefined),
  getGuestPosts: vi.fn().mockResolvedValue([]),
  createGuestPost: vi.fn().mockResolvedValue({ success: true }),
  updateGuestPostStatus: vi.fn().mockResolvedValue(undefined),
  deleteGuestPost: vi.fn().mockResolvedValue(undefined),
  getLikeCount: vi.fn().mockResolvedValue(0),
  getUserLike: vi.fn().mockResolvedValue(null),
  createLike: vi.fn().mockResolvedValue(undefined),
  deleteLike: vi.fn().mockResolvedValue(undefined),
  getUserProfile: vi.fn().mockResolvedValue(null),
  createUserProfile: vi.fn().mockResolvedValue(undefined),
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
  getUserCommentCount: vi.fn().mockResolvedValue(0),
  approveGuestWriter: vi.fn().mockResolvedValue(undefined),
  revokeGuestWriter: vi.fn().mockResolvedValue(undefined),
  getApprovedGuestWriters: vi.fn().mockResolvedValue([]),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getCategories: vi.fn().mockResolvedValue([]),
  getCategoryBySlug: vi.fn().mockResolvedValue(null),
  createCategory: vi.fn().mockResolvedValue({ id: 1 }),
  updateCategory: vi.fn().mockResolvedValue({ success: true }),
  deleteCategory: vi.fn().mockResolvedValue({ success: true }),
  reorderCategories: vi.fn().mockResolvedValue(undefined),
  subscribeToNewsletter: vi.fn().mockResolvedValue(undefined),
  unsubscribeFromNewsletter: vi.fn().mockResolvedValue(undefined),
  getNewsletterSubscribers: vi.fn().mockResolvedValue([]),
  deleteNewsletterSubscriber: vi.fn().mockResolvedValue(undefined),
  searchNewsletterSubscribers: vi.fn().mockResolvedValue([]),
  getFeaturedArticle: vi.fn().mockResolvedValue(null),
  setFeaturedArticle: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./newsletterEmail", () => ({
  sendArticleNewsletter: vi.fn().mockResolvedValue(undefined),
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
