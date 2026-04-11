import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mock ALL db functions so no real DB is touched ──────────────────────────
const seedCategories = [
  { id: 1, name: "ריפוי", slug: "healing", description: null, color: null, createdAt: new Date() },
  { id: 2, name: 'רמב"ם', slug: "רמבם", description: null, color: null, createdAt: new Date() },
  { id: 3, name: "כללי", slug: "כללי", description: null, color: null, createdAt: new Date() },
];

let mockCategories = [...seedCategories];
let nextCategoryId = 10;
const mockSubscribers: { email: string; name?: string }[] = [];

vi.mock("./db", () => ({
  getCategories: vi.fn().mockImplementation(async () => [...mockCategories]),
  getCategoryBySlug: vi.fn().mockImplementation(async (slug: string) =>
    mockCategories.find((c) => c.slug === slug) ?? undefined
  ),
  createCategory: vi.fn().mockImplementation(async (data: { name: string; slug: string; description?: string; color?: string }) => {
    const cat = { id: nextCategoryId++, ...data, description: data.description ?? null, color: data.color ?? null, createdAt: new Date() };
    mockCategories.push(cat);
    return cat;
  }),
  updateCategory: vi.fn().mockImplementation(async (id: number, data: Partial<{ name: string; color: string }>) => {
    mockCategories = mockCategories.map((c) => (c.id === id ? { ...c, ...data } : c));
    return { success: true };
  }),
  deleteCategory: vi.fn().mockImplementation(async (id: number) => {
    mockCategories = mockCategories.filter((c) => c.id !== id);
    return { success: true };
  }),
  subscribeNewsletter: vi.fn().mockImplementation(async (data: { email: string; name?: string }) => {
    mockSubscribers.push(data);
  }),
  subscribeToNewsletter: vi.fn().mockImplementation(async (data: { email: string; name?: string }) => {
    mockSubscribers.push(data);
  }),
  unsubscribeNewsletter: vi.fn().mockImplementation(async (email: string) => {
    const idx = mockSubscribers.findIndex((s) => s.email === email);
    if (idx !== -1) mockSubscribers.splice(idx, 1);
  }),
  unsubscribeFromNewsletter: vi.fn().mockImplementation(async (email: string) => {
    const idx = mockSubscribers.findIndex((s) => s.email === email);
    if (idx !== -1) mockSubscribers.splice(idx, 1);
  }),
  getNewsletterSubscribers: vi.fn().mockImplementation(async () => [...mockSubscribers]),
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
  getFeaturedArticle: vi.fn().mockResolvedValue(null),
  setFeaturedArticle: vi.fn().mockResolvedValue(undefined),
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

beforeEach(() => {
  mockCategories = [...seedCategories];
  nextCategoryId = 10;
  mockSubscribers.length = 0;
});

describe("categories", () => {
  it("lists categories publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const categories = await caller.categories.list();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThanOrEqual(3);
    for (const cat of categories) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("slug");
    }
  });

  it("fetches a category by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const cat = await caller.categories.bySlug({ slug: "healing" });
    expect(cat).toBeDefined();
    expect(cat?.slug).toBe("healing");
    expect(cat?.name).toBe("ריפוי");
  });

  it("returns undefined for non-existent slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const cat = await caller.categories.bySlug({ slug: "nonexistent-category-xyz" });
    expect(cat).toBeUndefined();
  });

  it("prevents non-admin from creating categories", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(
      caller.categories.create({ name: "Test", slug: "test" })
    ).rejects.toThrow();
  });

  it("prevents non-admin from deleting categories", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(
      caller.categories.delete({ id: 1 })
    ).rejects.toThrow();
  });

  it("prevents non-admin from updating categories", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(
      caller.categories.update({ id: 1, name: "Hacked" })
    ).rejects.toThrow();
  });

  it("admin can create, update, and delete a category", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Create
    const created = await caller.categories.create({
      name: "Test Category",
      slug: "test-cat-mock",
      description: "A test category",
      color: "#FF0000",
    });
    expect(created).toBeDefined();

    // Get the list to find the new category
    const list = await caller.categories.list();
    const newCat = list.find((c) => c.slug === "test-cat-mock");
    expect(newCat).toBeDefined();

    // Update
    const updateResult = await caller.categories.update({
      id: newCat!.id,
      name: "Updated Test Category",
      color: "#00FF00",
    });
    expect(updateResult).toEqual({ success: true });

    // Delete
    const deleteResult = await caller.categories.delete({ id: newCat!.id });
    expect(deleteResult).toEqual({ success: true });

    // Verify deleted
    const listAfter = await caller.categories.list();
    const found = listAfter.find((c) => c.id === newCat!.id);
    expect(found).toBeUndefined();
  });
});

describe("newsletter", () => {
  const testEmail = `test-mock@example.com`;

  it("allows public subscription", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.newsletter.subscribe({
      email: testEmail,
      name: "Test Subscriber",
    });
    expect(result).toEqual({ success: true });
  });

  it("allows public unsubscription", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.newsletter.unsubscribe({ email: testEmail });
    expect(result).toEqual({ success: true });
  });

  it("prevents non-admin from listing subscribers", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(caller.newsletter.list()).rejects.toThrow();
  });

  it("admin can list subscribers", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const subscribers = await caller.newsletter.list();
    expect(Array.isArray(subscribers)).toBe(true);
  });

  it("rejects invalid email format", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.newsletter.subscribe({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});
