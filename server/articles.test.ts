import { describe, expect, it, beforeEach, vi } from "vitest";
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
  getArticleById: vi.fn().mockResolvedValue({ id: 1, title: "Test", slug: "test", body: "body", category: "spirituality", published: true, authorId: 1, createdAt: new Date(), updatedAt: new Date() }),
  createArticle: vi.fn().mockResolvedValue({ insertId: 2 }),
  updateArticle: vi.fn().mockResolvedValue(undefined),
  deleteArticle: vi.fn().mockResolvedValue(undefined),
  getCommentsByArticle: vi.fn().mockResolvedValue([
    { id: 1, articleId: 1, userId: 2, body: "Great article!", createdAt: new Date(), userName: "User" },
  ]),
  createComment: vi.fn().mockResolvedValue({ insertId: 1 }),
  deleteComment: vi.fn().mockResolvedValue(undefined),
  getCommentById: vi.fn().mockResolvedValue({ id: 1, articleId: 1, userId: 2, body: "Great!", createdAt: new Date() }),
}));

function makeCtx(role: "user" | "admin" | null = null): TrpcContext {
  return {
    user: role
      ? {
          id: role === "admin" ? 1 : 2,
          openId: role === "admin" ? "admin-open-id" : "user-open-id",
          name: role === "admin" ? "Admin" : "User",
          email: null,
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

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
  it("returns article by slug", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.articles.bySlug({ slug: "test-article" });
    expect(result.slug).toBe("test-article");
    expect(result.title).toBe("Test Article");
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
      published: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.articles.create({
        title: "New Article",
        slug: "new-article",
        body: "Article body",
        category: "philosophy",
        published: false,
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
        published: false,
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
    expect(result.success).toBe(true);
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

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.comments.delete({ id: 1 })).rejects.toThrow();
  });
});
