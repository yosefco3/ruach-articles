import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  getArticles: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "Test Article",
      slug: "test-article",
      excerpt: "Test excerpt",
      coverImage: null,
      category: "spirituality",
      tags: "test",
      published: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      authorId: 1,
      authorName: "Admin",
    },
  ]),
  getArticleBySlug: vi.fn().mockResolvedValue({
    id: 1,
    title: "Test Article",
    slug: "test-article",
    excerpt: "Test excerpt",
    body: "Test body content",
    coverImage: null,
    category: "spirituality",
    tags: "test",
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 1,
    authorName: "Admin",
  }),
  getArticleById: vi.fn().mockResolvedValue({
    id: 1,
    title: "Test",
    slug: "test",
    body: "body",
    category: "spirituality",
    published: true,
    authorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createArticle: vi.fn().mockResolvedValue({ success: true, id: 2 }),
  updateArticle: vi.fn().mockResolvedValue(undefined),
  deleteArticle: vi.fn().mockResolvedValue(undefined),
  getAttachmentsByArticle: vi.fn().mockResolvedValue([]),
  getCommentsByArticle: vi.fn().mockResolvedValue([
    {
      id: 1,
      articleId: 1,
      userId: 2,
      body: "Great article!",
      createdAt: new Date(),
      userName: "User",
      parentCommentId: null,
    },
  ]),
  createComment: vi.fn().mockResolvedValue({ success: true, id: 1 }),
  deleteComment: vi.fn().mockResolvedValue(undefined),
  getCommentById: vi.fn().mockResolvedValue({
    id: 1,
    articleId: 1,
    userId: 2,
    body: "Great!",
    createdAt: new Date(),
  }),
  // Settings, about, guest posts, likes, profiles, users mocks
  getSiteSettings: vi.fn().mockResolvedValue({ siteTitle: "רוּחַ", heroSubtitle: "תיאור" }),
  updateSiteSettings: vi.fn().mockResolvedValue(undefined),
  getAboutPage: vi.fn().mockResolvedValue({ title: "אודות", content: "תוכן" }),
  updateAboutPage: vi.fn().mockResolvedValue(undefined),
  getGuestPosts: vi.fn().mockResolvedValue([]),
  createGuestPost: vi.fn().mockResolvedValue({ success: true }),
  updateGuestPostStatus: vi.fn().mockResolvedValue(undefined),
  deleteGuestPost: vi.fn().mockResolvedValue(undefined),
  getLikeCount: vi.fn().mockResolvedValue(5),
  getUserLike: vi.fn().mockResolvedValue(null),
  createLike: vi.fn().mockResolvedValue(undefined),
  deleteLike: vi.fn().mockResolvedValue(undefined),
  getUserProfile: vi.fn().mockResolvedValue(null),
  createUserProfile: vi.fn().mockResolvedValue(undefined),
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
  getUserCommentCount: vi.fn().mockResolvedValue(3),
  approveGuestWriter: vi.fn().mockResolvedValue(undefined),
  revokeGuestWriter: vi.fn().mockResolvedValue(undefined),
  getApprovedGuestWriters: vi.fn().mockResolvedValue([]),
  getAllUsers: vi.fn().mockResolvedValue([]),
}));

// Mock contact notifyOwner
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function makeCtx(role: "user" | "admin" | null = null, opts?: { guestPostApproved?: boolean }): TrpcContext {
  return {
    user: role
      ? {
          id: role === "admin" ? 1 : 2,
          openId: role === "admin" ? "admin-open-id" : "user-open-id",
          name: role === "admin" ? "Admin" : "User",
          email: null,
          loginMethod: "manus",
          role,
          guestPostApproved: opts?.guestPostApproved ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Articles ─────────────────────────────────────────────────────────────────

describe("articles.list", () => {
  it("returns published articles for public users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.articles.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("allows admin to list all articles", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.list({ all: true });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("articles.bySlug", () => {
  it("returns article by slug with attachments", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.articles.bySlug({ slug: "test-article" });
    expect(result).not.toBeNull();
    expect(result!.slug).toBe("test-article");
    expect(result!.title).toBe("Test Article");
    expect(Array.isArray(result!.attachments)).toBe(true);
  });
});

describe("articles.create", () => {
  it("allows admin to create an article", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.create({
      title: "New Article",
      slug: "new-article",
      body: "Article body",
      category: "philosophy",
    });
    expect(result).toBeDefined();
  });

  it("allows approved guest writer to create an article", async () => {
    const caller = appRouter.createCaller(makeCtx("user", { guestPostApproved: true }));
    const result = await caller.articles.create({
      title: "Guest Article",
      slug: "guest-article",
      body: "Guest body",
      category: "healing",
    });
    expect(result).toBeDefined();
  });

  it("rejects regular users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.articles.create({
        title: "New Article",
        slug: "new-article",
        body: "Article body",
        category: "philosophy",
      })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.articles.create({
        title: "New Article",
        slug: "new-article",
        body: "Article body",
        category: "philosophy",
      })
    ).rejects.toThrow();
  });
});

describe("articles.delete", () => {
  it("allows admin to delete an article", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.articles.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Comments ─────────────────────────────────────────────────────────────────

describe("comments.list", () => {
  it("returns comments for an article", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.comments.list({ articleId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].body).toBe("Great article!");
  });
});

describe("comments.create", () => {
  it("allows authenticated users to comment", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.comments.create({ articleId: 1, body: "Nice article!" });
    expect(result).toBeDefined();
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.comments.create({ articleId: 1, body: "Nice article!" })
    ).rejects.toThrow();
  });
});

describe("comments.delete", () => {
  it("allows comment owner to delete their comment", async () => {
    const caller = appRouter.createCaller(makeCtx("user")); // userId=2, comment.userId=2
    const result = await caller.comments.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("allows admin to delete any comment", async () => {
    const caller = appRouter.createCaller(makeCtx("admin")); // userId=1, comment.userId=2
    const result = await caller.comments.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.comments.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

describe("settings", () => {
  it("returns site settings publicly", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.settings.get();
    expect(result).toBeDefined();
    expect(result.siteTitle).toBe("רוּחַ");
  });

  it("allows admin to update settings", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.settings.update({ siteTitle: "שם חדש" });
    expect(result).toBeDefined();
  });

  it("rejects non-admin settings update", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.settings.update({ siteTitle: "שם חדש" })).rejects.toThrow();
  });
});

// ─── About ────────────────────────────────────────────────────────────────────

describe("about", () => {
  it("returns about page publicly", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.about.get();
    expect(result).toBeDefined();
  });

  it("allows admin to update about page", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.about.update({ title: "אודות", content: "תוכן חדש" });
    expect(result).toBeDefined();
  });

  it("rejects non-admin about update", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.about.update({ title: "אודות", content: "תוכן" })).rejects.toThrow();
  });
});

// ─── Guest Writers ────────────────────────────────────────────────────────────

describe("guestWriters", () => {
  it("allows admin to approve a guest writer", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.guestWriters.approve({ userId: 2 });
    expect(result.success).toBe(true);
  });

  it("allows admin to revoke a guest writer", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.guestWriters.revoke({ userId: 2 });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin guest writer approval", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.guestWriters.approve({ userId: 2 })).rejects.toThrow();
  });
});

// ─── Likes ────────────────────────────────────────────────────────────────────

describe("likes", () => {
  it("returns like count publicly", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.likes.count({ articleId: 1 });
    expect(result).toBe(5);
  });

  it("allows authenticated user to toggle like", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.likes.toggle({ articleId: 1 });
    expect(result.liked).toBe(true);
  });

  it("rejects unauthenticated like toggle", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.likes.toggle({ articleId: 1 })).rejects.toThrow();
  });
});
