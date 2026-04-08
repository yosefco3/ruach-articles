import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createArticle,
  createComment,
  deleteArticle,
  deleteComment,
  getArticleById,
  getArticleBySlug,
  getArticles,
  getCommentById,
  getCommentsByArticle,
  updateArticle,
  getAttachmentsByArticle,
  getSiteSettings,
  updateSiteSettings,
  getGuestPosts,
  createGuestPost,
  updateGuestPostStatus,
  deleteGuestPost,
  getLikeCount,
  getUserLike,
  createLike,
  deleteLike,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  getUserCommentCount,
} from "./db";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { contactRouter } from "./contact";

// ─── Admin guard middleware ───────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "נדרשות הרשאות מנהל" });
  }
  return next({ ctx });
});

// ─── Articles router ──────────────────────────────────────────────────────────
const articlesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.enum(["spirituality", "philosophy", "healing"]).optional(),
        all: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      const published = isAdmin && input?.all ? undefined : true;
      return getArticles({ category: input?.category, published });
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const article = await getArticleBySlug(input.slug);
      if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "המאמר לא נמצא" });
      if (!article.published && ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "NOT_FOUND", message: "המאמר לא נמצא" });
      }
      const attachments = await getAttachmentsByArticle(article.id);
      return { ...article, attachments };
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
        excerpt: z.string().optional(),
        body: z.string().min(1),
        coverImage: z.string().optional(),
        category: z.enum(["spirituality", "philosophy", "healing"]),
        tags: z.string().optional(),
        published: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createArticle({
        ...input,
        excerpt: input.excerpt ?? null,
        coverImage: input.coverImage ?? null,
        tags: input.tags ?? "",
        authorId: ctx.user.id,
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        body: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.enum(["spirituality", "philosophy", "healing"]).optional(),
        tags: z.string().optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateArticle(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteArticle(input.id);
      return { success: true };
    }),
});

// ─── Comments router ──────────────────────────────────────────────────────────
const commentsRouter = router({
  list: publicProcedure
    .input(z.object({ articleId: z.number() }))
    .query(async ({ input }) => getCommentsByArticle(input.articleId)),

  create: protectedProcedure
    .input(
      z.object({
        articleId: z.number(),
        body: z.string().min(1),
        parentCommentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createComment({
        articleId: input.articleId,
        userId: ctx.user.id,
        body: input.body,
        parentCommentId: input.parentCommentId ?? null,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const comment = await getCommentById(input.id);
      if (!comment) throw new TRPCError({ code: "NOT_FOUND", message: "התגובה לא נמצאה" });
      if (comment.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "אין הרשאה למחוק תגובה זו" });
      }
      await deleteComment(input.id, comment.userId);
      return { success: true };
    }),
});

// ─── Settings router ──────────────────────────────────────────────────────────
const settingsRouter = router({
  get: publicProcedure.query(async () => getSiteSettings()),
  
  update: adminProcedure
    .input(z.object({
      siteTitle: z.string().min(1).optional(),
      heroSubtitle: z.string().min(1).optional(),
    }))
    .mutation(async ({ input }) => {
      await updateSiteSettings(input);
      return { success: true };
    }),
});

// ─── Guest Posts router ────────────────────────────────────────────────────────
const guestPostsRouter = router({
  list: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
    .query(async ({ input }) => getGuestPosts(input?.status)),

  submit: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      authorName: z.string().min(1),
      authorEmail: z.string().email(),
      body: z.string().min(1),
      category: z.enum(["spirituality", "philosophy", "healing"]),
    }))
    .mutation(async ({ input }) => {
      await createGuestPost(input);
      return { success: true };
    }),

  approve: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateGuestPostStatus(input.id, "approved");
      return { success: true };
    }),

  reject: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateGuestPostStatus(input.id, "rejected");
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteGuestPost(input.id);
      return { success: true };
    }),
});

// ─── Likes router ──────────────────────────────────────────────────────────────
const likesRouter = router({
  count: publicProcedure
    .input(z.object({
      articleId: z.number().optional(),
      commentId: z.number().optional(),
    }))
    .query(async ({ input }) => getLikeCount(input.articleId, input.commentId)),

  toggle: protectedProcedure
    .input(z.object({
      articleId: z.number().optional(),
      commentId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserLike(ctx.user.id, input.articleId, input.commentId);
      if (existing) {
        await deleteLike(existing.id);
        return { liked: false };
      } else {
        await createLike({ userId: ctx.user.id, articleId: input.articleId, commentId: input.commentId });
        return { liked: true };
      }
    }),
});

// ─── User Profiles router ──────────────────────────────────────────────────────
const profilesRouter = router({
  get: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserProfile(input.userId);
      const commentCount = await getUserCommentCount(input.userId);
      return { profile, commentCount };
    }),

  update: protectedProcedure
    .input(z.object({ bio: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserProfile(ctx.user.id);
      if (!existing) {
        await createUserProfile({ userId: ctx.user.id, bio: input.bio });
      } else {
        await updateUserProfile(ctx.user.id, { bio: input.bio });
      }
      return { success: true };
    }),
});

// ─── App router ────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  articles: articlesRouter,
  comments: commentsRouter,
  contact: contactRouter,
  settings: settingsRouter,
  guestPosts: guestPostsRouter,
  likes: likesRouter,
  profiles: profilesRouter,
});

export type AppRouter = typeof appRouter;
