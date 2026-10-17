import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers/index";
import type { TrpcContext } from "./_core/context";


// Mock db so no real DB is touched
vi.mock("./db", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({ siteTitle: "רוּחַ", heroSubtitle: "", contactEmail: null }),
  getTeacherById: vi.fn().mockResolvedValue(undefined),
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

describe("contact.submit", () => {
  it("submits contact form with valid data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "יוסף כהן",
      email: "yosef@example.com",
      subject: "שאלה על הפלטפורמה",
      message: "זו הודעה ארוכה מספיק לבדיקה",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("בהצלחה");
  });

  it("rejects contact form with invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "יוסף כהן",
        email: "invalid-email",
        subject: "שאלה על הפלטפורמה",
        message: "זו הודעה ארוכה מספיק לבדיקה",
      });
      expect.fail("Should have thrown validation error");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });

  it("rejects contact form with short name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "א",
        email: "yosef@example.com",
        subject: "שאלה על הפלטפורמה",
        message: "זו הודעה ארוכה מספיק לבדיקה",
      });
      expect.fail("Should have thrown validation error");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });

  it("rejects contact form with short subject", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "יוסף כהן",
        email: "yosef@example.com",
        subject: "קצר",
        message: "זו הודעה ארוכה מספיק לבדיקה",
      });
      expect.fail("Should have thrown validation error");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });

  it("rejects contact form with short message", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "יוסף כהן",
        email: "yosef@example.com",
        subject: "שאלה על הפלטפורמה",
        message: "קצר",
      });
      expect.fail("Should have thrown validation error");
    } catch (err: any) {
      expect(err.code).toBe("BAD_REQUEST");
    }
  });

  it("toTeacher: unknown or hidden teacher → success:false without sending", async () => {
    const { getTeacherById } = await import("./db");
    vi.mocked(getTeacherById).mockResolvedValueOnce(undefined as any);
    const caller = appRouter.createCaller(createPublicContext());
    const r = await caller.contact.toTeacher({ teacherId: 1, name: "דני", email: "d@example.com", message: "שלום, אשמח לשיחה איתך" });
    expect(r.success).toBe(false);
    vi.mocked(getTeacherById).mockResolvedValueOnce({ id: 1, visible: false, name: "x", contactEmail: "t@example.com" } as any);
    expect((await caller.contact.toTeacher({ teacherId: 1, name: "דני", email: "d@example.com", message: "שלום, אשמח לשיחה איתך" })).success).toBe(false);
  });

  it("toTeacher: validates the message shape", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.contact.toTeacher({ teacherId: 1, name: "ד", email: "d@example.com", message: "שלום שלום שלום" })).rejects.toThrow();
    await expect(caller.contact.toTeacher({ teacherId: 1, name: "דני", email: "nope", message: "שלום שלום שלום" })).rejects.toThrow();
  });
});
