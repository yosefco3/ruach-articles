import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ── Mock ALL db functions so no real DB is touched ──────────────────────────
const mockArticle1 = {
  id: 101,
  title: "Test Featured Article",
  slug: "test-featured-101",
  body: "This is a test featured article",
  category: "רוחניות",
  authorId: 1,
  published: true,
  excerpt: null,
  coverImage: null,
  tags: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  authorName: "Admin",
};

const mockArticle2 = {
  id: 102,
  title: "Another Test Article",
  slug: "test-featured-102",
  body: "This is another test article",
  category: "פילוסופיה",
  authorId: 1,
  published: true,
  excerpt: null,
  coverImage: null,
  tags: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  authorName: "Admin",
};

let currentFeatured = mockArticle1;

vi.mock("./db", () => ({
  createArticle: vi.fn().mockImplementation(async (data) => {
    return data.title === "Another Test Article" ? mockArticle2 : mockArticle1;
  }),
  setFeaturedArticle: vi.fn().mockImplementation(async (id: number) => {
    currentFeatured = id === mockArticle2.id ? mockArticle2 : mockArticle1;
  }),
  getFeaturedArticle: vi.fn().mockImplementation(async () => currentFeatured),
  // Other db functions used by routers
  getArticles: vi.fn().mockResolvedValue([]),
  getArticleBySlug: vi.fn().mockResolvedValue(null),
  getArticleById: vi.fn().mockResolvedValue(null),
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
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getNewsletterSubscribers: vi.fn().mockResolvedValue([]),
  subscribeNewsletter: vi.fn().mockResolvedValue(undefined),
  unsubscribeNewsletter: vi.fn().mockResolvedValue(undefined),
}));


import { createArticle, setFeaturedArticle, getFeaturedArticle } from "./db";

describe("Featured Article", () => {
  beforeEach(() => {
    currentFeatured = mockArticle1;
    vi.clearAllMocks();
  });

  it("should set featured article", async () => {
    await setFeaturedArticle(mockArticle1.id);
    const featured = await getFeaturedArticle();
    expect(featured).toBeDefined();
    expect(featured?.id).toBe(mockArticle1.id);
  });

  it("should get featured article", async () => {
    const featured = await getFeaturedArticle();
    expect(featured).toBeDefined();
    expect(featured?.title).toBe("Test Featured Article");
  });

  it("should update featured article when setting a new one", async () => {
    const result = await createArticle({
      title: "Another Test Article",
      slug: "test-featured-102",
      body: "This is another test article",
      category: "פילוסופיה",
      authorId: 1,
      published: true,
    });

    await setFeaturedArticle(result.id);
    const featured = await getFeaturedArticle();
    expect(featured?.id).toBe(mockArticle2.id);
    expect(featured?.title).toBe("Another Test Article");
  });
});
