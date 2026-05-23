import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── In-memory store — no real DB is touched ──────────────────────────────────
type MockSubscriber = {
  id: number;
  email: string;
  name: string | null;
  active: boolean;
  subscribedAt: Date;
};

let mockSubscribers: MockSubscriber[] = [];
let nextId = 1;

vi.mock("./db", () => ({
  // Newsletter helpers under test
  subscribeToNewsletter: vi.fn().mockImplementation(async (data: { email: string; name?: string }) => {
    const existing = mockSubscribers.find((s) => s.email === data.email);
    if (existing) {
      existing.active = true;
    } else {
      mockSubscribers.push({ id: nextId++, email: data.email, name: data.name ?? null, active: true, subscribedAt: new Date() });
    }
  }),
  unsubscribeFromNewsletter: vi.fn().mockImplementation(async (email: string) => {
    const sub = mockSubscribers.find((s) => s.email === email);
    if (sub) sub.active = false;
  }),
  getNewsletterSubscribers: vi.fn().mockImplementation(async () => [...mockSubscribers]),
  deleteNewsletterSubscriber: vi.fn().mockImplementation(async (id: number) => {
    mockSubscribers = mockSubscribers.filter((s) => s.id !== id);
  }),
  searchNewsletterSubscribers: vi.fn().mockImplementation(async (query: string) =>
    mockSubscribers.filter((s) => s.email.includes(query))
  ),
  // Other db functions required by appRouter
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
  getCategories: vi.fn().mockResolvedValue([]),
  getCategoryBySlug: vi.fn().mockResolvedValue(null),
  createCategory: vi.fn().mockResolvedValue({ id: 1 }),
  updateCategory: vi.fn().mockResolvedValue({ success: true }),
  deleteCategory: vi.fn().mockResolvedValue({ success: true }),
  reorderCategories: vi.fn().mockResolvedValue(undefined),
  reorderArticles: vi.fn().mockResolvedValue(undefined),
  getCategoriesWithArticleCount: vi.fn().mockResolvedValue([]),
  getFeaturedArticle: vi.fn().mockResolvedValue(null),
  setFeaturedArticle: vi.fn().mockResolvedValue(undefined),
}));


vi.mock("./newsletterEmail", () => ({
  sendArticleNewsletter: vi.fn().mockResolvedValue(undefined),
}));

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Admin",
      email: "admin@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

beforeEach(() => {
  mockSubscribers = [];
  nextId = 1;
  vi.clearAllMocks();
});

describe("Newsletter management (mocked DB)", () => {
  it("subscribe adds a new subscriber", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.newsletter.subscribe({ email: "a@example.com", name: "Alice" });
    expect(result).toEqual({ success: true });
    expect(mockSubscribers).toHaveLength(1);
    expect(mockSubscribers[0].email).toBe("a@example.com");
    expect(mockSubscribers[0].active).toBe(true);
  });

  it("unsubscribe marks subscriber as inactive", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await caller.newsletter.subscribe({ email: "b@example.com" });
    await caller.newsletter.unsubscribe({ email: "b@example.com" });
    expect(mockSubscribers[0].active).toBe(false);
  });

  it("admin list returns all subscribers", async () => {
    mockSubscribers.push(
      { id: nextId++, email: "c@example.com", name: "C", active: true, subscribedAt: new Date() },
      { id: nextId++, email: "d@example.com", name: "D", active: false, subscribedAt: new Date() }
    );
    const caller = appRouter.createCaller(makeAdminCtx());
    const list = await caller.newsletter.list({});
    expect(list).toHaveLength(2);
  });

  it("admin list with search filters by email", async () => {
    mockSubscribers.push(
      { id: nextId++, email: "search-me@example.com", name: null, active: true, subscribedAt: new Date() },
      { id: nextId++, email: "other@example.com", name: null, active: true, subscribedAt: new Date() }
    );
    const caller = appRouter.createCaller(makeAdminCtx());
    const list = await caller.newsletter.list({ search: "search-me" });
    expect(list).toHaveLength(1);
    expect(list[0].email).toBe("search-me@example.com");
  });

  it("admin delete removes a subscriber", async () => {
    mockSubscribers.push(
      { id: 10, email: "del@example.com", name: null, active: true, subscribedAt: new Date() }
    );
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.newsletter.delete({ id: 10 });
    expect(result).toEqual({ success: true });
    expect(mockSubscribers).toHaveLength(0);
  });

  it("non-admin cannot list subscribers", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.newsletter.list({})).rejects.toThrow();
  });

  it("non-admin cannot delete a subscriber", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.newsletter.delete({ id: 1 })).rejects.toThrow();
  });
});
