import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mock ALL db functions so no real DB is touched ──────────────────────────
let mockAboutPage = {
  title: "אודות",
  content: "<p>תוכן בדיקה</p>",
  imageUrl: null as string | null,
};

vi.mock("./db", () => ({
  getAboutPage: vi.fn().mockImplementation(async () => ({ ...mockAboutPage })),
  updateAboutPage: vi.fn().mockImplementation(async (data: Partial<typeof mockAboutPage>) => {
    mockAboutPage = { ...mockAboutPage, ...data, imageUrl: data.imageUrl ?? null };
    return { ...mockAboutPage };
  }),
  // Other db functions used by routers
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
  getSiteSettings: vi.fn().mockResolvedValue({ siteTitle: "רוּחַ", heroSubtitle: "" }),
  updateSiteSettings: vi.fn().mockResolvedValue(undefined),
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
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getNewsletterSubscribers: vi.fn().mockResolvedValue([]),
  subscribeToNewsletter: vi.fn().mockResolvedValue(undefined),
  unsubscribeFromNewsletter: vi.fn().mockResolvedValue(undefined),
  deleteNewsletterSubscriber: vi.fn().mockResolvedValue(undefined),
  searchNewsletterSubscribers: vi.fn().mockResolvedValue([]),
  reorderCategories: vi.fn().mockResolvedValue(undefined),
  reorderArticles: vi.fn().mockResolvedValue(undefined),
  getCategoriesWithArticleCount: vi.fn().mockResolvedValue([]),
  getFeaturedArticle: vi.fn().mockResolvedValue(null),
  setFeaturedArticle: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./newsletterEmail", () => ({
  sendArticleNewsletter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

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
