import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };
}

function createUserContext(userId: number = 2): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };
}

describe("Phase 4: Advanced Features", () => {
  describe("Site Settings", () => {
    it("admin can get site settings", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const settings = await caller.settings.get();
      expect(settings).toBeDefined();
      expect(settings.siteTitle).toBeDefined();
      expect(settings.heroSubtitle).toBeDefined();
    });

    it("admin can update site settings", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const updated = await caller.settings.update({
        siteTitle: "Test Title",
        heroSubtitle: "Test Subtitle",
      });
      expect(updated.siteTitle).toBe("Test Title");
      expect(updated.heroSubtitle).toBe("Test Subtitle");
    });

    it("non-admin cannot update site settings", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      try {
        await caller.settings.update({
          siteTitle: "Hacked",
          heroSubtitle: "Hacked",
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("Guest Posts", () => {
    it("user can submit guest post", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.guestPosts.submit({
        title: "My Guest Post",
        authorName: "John Doe",
        authorEmail: "john@example.com",
        body: "This is my guest post",
        category: "spirituality",
      });
      expect(result.id).toBeDefined();
      expect(result.status).toBe("pending");
    });

    it("admin can list guest posts by status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const posts = await caller.guestPosts.list({ status: "pending" });
      expect(Array.isArray(posts)).toBe(true);
    });

    it("admin can approve guest post", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      // First submit a guest post
      const userCaller = appRouter.createCaller(createUserContext(10));
      const submitted = await userCaller.guestPosts.submit({
        title: "Test Post",
        authorName: "Test",
        authorEmail: "test@example.com",
        body: "Test body",
        category: "philosophy",
      });
      // Then approve it
      const approved = await caller.guestPosts.approve({ id: submitted.id });
      expect(approved.status).toBe("approved");
    });

    it("admin can reject guest post", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const userCaller = appRouter.createCaller(createUserContext(11));
      const submitted = await userCaller.guestPosts.submit({
        title: "Test Post",
        authorName: "Test",
        authorEmail: "test@example.com",
        body: "Test body",
        category: "healing",
      });
      const rejected = await caller.guestPosts.reject({ id: submitted.id });
      expect(rejected.status).toBe("rejected");
    });
  });

  describe("Comments with Replies", () => {
    it("user can create top-level comment", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const comment = await caller.comments.create({
        articleId: 1,
        body: "Great article!",
      });
      expect(comment.id).toBeDefined();
      expect(comment.body).toBe("Great article!");
    });

    it("user can reply to comment", async () => {
      const ctx = createUserContext(20);
      const caller = appRouter.createCaller(ctx);
      // Create parent comment
      const parent = await caller.comments.create({
        articleId: 1,
        body: "Original comment",
      });
      // Create reply
      const reply = await caller.comments.create({
        articleId: 1,
        body: "Reply to comment",
        parentCommentId: parent.id,
      });
      expect(reply.parentCommentId).toBe(parent.id);
    });

    it("user can delete their own comment", async () => {
      const ctx = createUserContext(21);
      const caller = appRouter.createCaller(ctx);
      const comment = await caller.comments.create({
        articleId: 1,
        body: "My comment",
      });
      const result = await caller.comments.delete({ id: comment.id });
      expect(result.success).toBe(true);
    });

    it("admin can delete any comment", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      // User creates comment
      const userCaller = appRouter.createCaller(createUserContext(22));
      const comment = await userCaller.comments.create({
        articleId: 1,
        body: "User comment",
      });
      // Admin deletes it
      if (comment.id) {
        const result = await caller.comments.delete({ id: comment.id });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Likes System", () => {
    it("user can like an article", async () => {
      const ctx = createUserContext(30);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.likes.toggle({ articleId: 1 });
      expect(result.liked).toBeDefined();
    });

    it("user can like a comment", async () => {
      const ctx = createUserContext(31);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.likes.toggle({ commentId: 1 });
      expect(result.liked).toBeDefined();
    });

    it("user can unlike by toggling", async () => {
      const ctx = createUserContext(32);
      const caller = appRouter.createCaller(ctx);
      // Like
      const like1 = await caller.likes.toggle({ articleId: 1 });
      // Unlike
      const like2 = await caller.likes.toggle({ articleId: 1 });
      expect(like1.liked).not.toBe(like2.liked);
    });
  });

  describe("User Profiles", () => {
    it("can get user profile", async () => {
      const ctx = createUserContext(40);
      const caller = appRouter.createCaller(ctx);
      const profile = await caller.profiles.get({ userId: ctx.user!.id });
      expect(profile).toBeDefined();
      expect(profile.profile).toBeDefined();
    });

    it("profile includes comment count", async () => {
      const ctx = createUserContext(41);
      const caller = appRouter.createCaller(ctx);
      const profile = await caller.profiles.get({ userId: ctx.user!.id });
      expect(typeof profile.commentCount).toBe("number");
    });
  });

  describe("Articles", () => {
    it("can list articles", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const results = await caller.articles.list();
      expect(Array.isArray(results)).toBe(true);
    });

    it("can get article by slug", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      const article = await caller.articles.bySlug({ slug: "meditation-as-a-way-of-life" });
      expect(article).toBeDefined();
      if (article) {
        expect(article.title).toBeDefined();
        expect(article.body).toBeDefined();
      }
    });
  });
});
