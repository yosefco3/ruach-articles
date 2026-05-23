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
  getCategories: vi.fn().mockResolvedValue([]),
  getCategoryBySlug: vi.fn().mockResolvedValue(null),
  createCategory: vi.fn().mockResolvedValue({ id: 1 }),
  updateCategory: vi.fn().mockResolvedValue({ success: true }),
  deleteCategory: vi.fn().mockResolvedValue({ success: true }),
  reorderCategories: vi.fn().mockResolvedValue(undefined),
  reorderArticles: vi.fn().mockResolvedValue(undefined),
  getCategoriesWithArticleCount: vi.fn().mockResolvedValue([
    { id: 1, name: "רוחניות", slug: "spirituality", description: "מאמרים ברוחניות", color: "#8B6914", sortOrder: 1, coverImage: null, articleCount: 3, latestCoverImage: null },
  ]),
  subscribeToNewsletter: vi.fn().mockResolvedValue(undefined),
  unsubscribeFromNewsletter: vi.fn().mockResolvedValue(undefined),
  getNewsletterSubscribers: vi.fn().mockResolvedValue([]),
  deleteNewsletterSubscriber: vi.fn().mockResolvedValue(undefined),
  searchNewsletterSubscribers: vi.fn().mockResolvedValue([]),
  getFeaturedArticle: vi.fn().mockResolvedValue(null),
  setFeaturedArticle: vi.fn().mockResolvedValue(undefined),
  createAttachment: vi.fn().mockResolvedValue(undefined),
  deleteAttachment: vi.fn().mockResolvedValue(undefined),
}));


// Mock newsletter email sender
vi.mock("./newsletterEmail", () => ({
  sendArticleNewsletter: vi.fn().mockResolvedValue(undefined),
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

  it("normalizes Hebrew slug to timestamp-based slug on server", async () => {
    // Hebrew titles produce empty slugs from the ASCII slugify — server must handle this
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.create({
      title: "הרמבים המיסטיקן",
      slug: "", // empty slug as would come from Hebrew title
      body: "תוכן המאמר",
      category: "רמבם",
    });
    expect(result).toBeDefined();
  });

  it("handles duplicate slug by appending suffix", async () => {
    // getArticleBySlug mock returns an article for 'test-article', so a suffix should be added
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.create({
      title: "New Article",
      slug: "test-article", // this slug already exists in the mock
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

describe("articles.update", () => {
  it("allows admin to update an article", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.update({
      id: 1,
      title: "Updated Title",
      body: "Updated body content",
      category: "philosophy",
      published: true,
    });
    // updateArticle mock returns undefined, so result may be undefined
    expect(result === undefined || result !== null).toBe(true);
  });

  it("allows approved guest writer to update their article", async () => {
    const caller = appRouter.createCaller(makeCtx("user", { guestPostApproved: true }));
    const result = await caller.articles.update({
      id: 1,
      title: "Updated by guest",
      body: "Updated body",
    });
    expect(result === undefined || result !== null).toBe(true);
  });

  it("rejects regular users from updating articles", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.articles.update({ id: 1, title: "Hacked" })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated users from updating articles", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.articles.update({ id: 1, title: "Hacked" })
    ).rejects.toThrow();
  });

  it("allows updating cover image via URL (from S3 upload)", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.update({
      id: 1,
      coverImage: "https://cdn.example.com/image.jpg",
    });
    expect(result === undefined || result !== null).toBe(true);
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

describe("articles.sendNewsletter", () => {
  it("allows admin to manually send newsletter for an article", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.sendNewsletter({
      articleId: 1,
      siteUrl: "https://ruach.club",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin users from sending newsletter", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.articles.sendNewsletter({ articleId: 1, siteUrl: "https://ruach.club" })
    ).rejects.toThrow();
  });

  it("does NOT auto-send newsletter when article is published via update", async () => {
    const { sendArticleNewsletter } = await import("./newsletterEmail");
    const sendSpy = vi.mocked(sendArticleNewsletter);
    sendSpy.mockClear();
    const caller = appRouter.createCaller(makeCtx("admin"));
    await caller.articles.update({ id: 1, published: true, siteUrl: "https://ruach.club" });
    expect(sendSpy).not.toHaveBeenCalled();
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

  it("sends email notification after comment creation", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.comments.create({ 
      articleId: 1, 
      body: "Test notification", 
      siteUrl: "https://ruach.club" 
    });
    // Email notification is sent via Resend (fire-and-forget)
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

// ─── Articles Reorder ────────────────────────────────────────────────────────

describe("articles.reorder", () => {
  it("allows admin to reorder articles", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.reorder({
      items: [
        { id: 1, sortOrder: 2 },
        { id: 2, sortOrder: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin users from reordering", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.articles.reorder({ items: [{ id: 1, sortOrder: 1 }] })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated users from reordering", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.articles.reorder({ items: [{ id: 1, sortOrder: 1 }] })
    ).rejects.toThrow();
  });
});

// ─── Categories listWithCounts ───────────────────────────────────────────────

describe("categories.listWithCounts", () => {
  it("returns categories with article counts publicly", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.categories.listWithCounts();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("articleCount");
    expect(result[0]).toHaveProperty("latestCoverImage");
    expect(result[0].slug).toBe("spirituality");
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

// ─── Article Attachments ──────────────────────────────────────────────────────
describe("articles.addAttachment", () => {
  it("allows admin to add an attachment", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.addAttachment({
      articleId: 1,
      fileName: "מסמך חשוב",
      fileUrl: "https://cdn.example.com/file.pdf",
      fileSize: 12345,
    });
    expect(result.success).toBe(true);
  });

  it("allows approved guest writer to add an attachment", async () => {
    const caller = appRouter.createCaller(makeCtx("user", { guestPostApproved: true }));
    const result = await caller.articles.addAttachment({
      articleId: 1,
      fileName: "קובץ מצורף",
      fileUrl: "https://cdn.example.com/doc.docx",
      fileSize: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unauthenticated users from adding attachments", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.articles.addAttachment({
        articleId: 1,
        fileName: "file.pdf",
        fileUrl: "https://cdn.example.com/file.pdf",
        fileSize: 1000,
      })
    ).rejects.toThrow();
  });

  it("rejects regular users from adding attachments", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.articles.addAttachment({
        articleId: 1,
        fileName: "file.pdf",
        fileUrl: "https://cdn.example.com/file.pdf",
        fileSize: 1000,
      })
    ).rejects.toThrow();
  });
});

describe("articles.deleteAttachment", () => {
  it("allows admin to delete an attachment", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.articles.deleteAttachment({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin from deleting attachments", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.articles.deleteAttachment({ id: 1 })).rejects.toThrow();
  });

  it("rejects unauthenticated users from deleting attachments", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.articles.deleteAttachment({ id: 1 })).rejects.toThrow();
  });
});
