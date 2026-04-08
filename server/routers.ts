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
  getAboutPage,
  updateAboutPage,
  approveGuestWriter,
  revokeGuestWriter,
  getApprovedGuestWriters,
  getAllUsers,
} from "./db";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { contactRouter } from "./contact";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({ ctx });
});

// Writer guard: admin OR approved guest writer
const writerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const isAdmin = ctx.user.role === "admin";
  const isApprovedWriter = (ctx.user as any).guestPostApproved === true;
  if (!isAdmin && !isApprovedWriter) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({ ctx });
});

// Articles router
const articlesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.enum(["spirituality", "philosophy", "healing"]).optional(),
          all: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      const all = isAdmin && input?.all;
      const articles = await getArticles({
        category: input?.category,
        published: all ? undefined : true,
      });
      return articles;
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const article = await getArticleBySlug(input.slug);
      if (!article) return null;
      const attachments = await getAttachmentsByArticle(article.id);
      return { ...article, attachments };
    }),

  create: writerProcedure
    .input(
      z.object({
        title: z.string(),
        slug: z.string(),
        excerpt: z.string().optional(),
        body: z.string(),
        coverImage: z.string().optional(),
        category: z.enum(["spirituality", "philosophy", "healing"]),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createArticle({
        ...input,
        authorId: ctx.user!.id,
        published: false,
      });
    }),

  update: writerProcedure
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
      return await updateArticle(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteArticle(input.id);
      return { success: true };
    }),
});

// Comments router
const commentsRouter = router({
  list: publicProcedure
    .input(z.object({ articleId: z.number() }))
    .query(async ({ input }) => {
      return await getCommentsByArticle(input.articleId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        articleId: z.number(),
        body: z.string(),
        parentCommentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createComment({
        articleId: input.articleId,
        userId: ctx.user!.id,
        body: input.body,
        parentCommentId: input.parentCommentId,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const comment = await getCommentById(input.id);
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      // Allow deletion by comment owner OR admin
      if (comment.userId !== ctx.user!.id && ctx.user!.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deleteComment(input.id);
      return { success: true };
    }),
});

// Settings router
const settingsRouter = router({
  get: publicProcedure.query(async () => {
    return await getSiteSettings();
  }),

  update: adminProcedure
    .input(
      z.object({
        siteTitle: z.string().optional(),
        heroSubtitle: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateSiteSettings(input);
      return await getSiteSettings();
    }),
});

// Guest Posts router
const guestPostsRouter = router({
  list: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }))
    .query(async ({ input }) => {
      return await getGuestPosts(input.status);
    }),

  submit: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        authorName: z.string(),
        authorEmail: z.string(),
        body: z.string(),
        category: z.enum(["spirituality", "philosophy", "healing"]),
      })
    )
    .mutation(async ({ input }) => {
      return await createGuestPost(input);
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

// Likes router
const likesRouter = router({
  toggle: protectedProcedure
    .input(
      z.object({
        articleId: z.number().optional(),
        commentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserLike(ctx.user!.id, input.articleId, input.commentId);
      if (existing) {
        await deleteLike(existing.id);
        return { liked: false };
      } else {
        await createLike({
          userId: ctx.user!.id,
          articleId: input.articleId,
          commentId: input.commentId,
        });
        return { liked: true };
      }
    }),

  count: publicProcedure
    .input(
      z.object({
        articleId: z.number().optional(),
        commentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getLikeCount(input.articleId, input.commentId);
    }),

  userLike: protectedProcedure
    .input(
      z.object({
        articleId: z.number().optional(),
        commentId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await getUserLike(ctx.user!.id, input.articleId, input.commentId);
    }),
});

// Profiles router
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
      const existing = await getUserProfile(ctx.user!.id);
      if (!existing) {
        await createUserProfile({ userId: ctx.user!.id, bio: input.bio });
      } else {
        await updateUserProfile(ctx.user!.id, { bio: input.bio });
      }
      return { success: true };
    }),
});

// About Page router
const aboutRouter = router({
  get: publicProcedure.query(async () => {
    return await getAboutPage();
  }),

  update: adminProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      await updateAboutPage({ title: input.title, content: input.content });
      return await getAboutPage();
    }),
});

// Users router (admin)
const usersRouter = router({
  list: adminProcedure.query(async () => {
    return await getAllUsers();
  }),
});

// Guest Writers router
const guestWritersRouter = router({
  list: adminProcedure.query(async () => {
    return await getApprovedGuestWriters();
  }),

  approve: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await approveGuestWriter(input.userId);
      return { success: true };
    }),

  revoke: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await revokeGuestWriter(input.userId);
      return { success: true };
    }),
});

// App router
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
  about: aboutRouter,
  guestPosts: guestPostsRouter,
  guestWriters: guestWritersRouter,
  likes: likesRouter,
  profiles: profilesRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
