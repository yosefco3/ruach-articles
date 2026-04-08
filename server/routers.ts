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
        all: z.boolean().optional(), // admin: include unpublished
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
      return article;
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
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        excerpt: z.string().optional(),
        body: z.string().min(1).optional(),
        coverImage: z.string().optional().nullable(),
        category: z.enum(["spirituality", "philosophy", "healing"]).optional(),
        tags: z.string().optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const existing = await getArticleById(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "המאמר לא נמצא" });
      await updateArticle(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await getArticleById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "המאמר לא נמצא" });
      await deleteArticle(input.id);
      return { success: true };
    }),
});

// ─── Comments router ──────────────────────────────────────────────────────────
const commentsRouter = router({
  list: publicProcedure
    .input(z.object({ articleId: z.number() }))
    .query(async ({ input }) => {
      return getCommentsByArticle(input.articleId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        articleId: z.number(),
        body: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createComment({
        articleId: input.articleId,
        userId: ctx.user.id,
        body: input.body,
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

// ─── App router ───────────────────────────────────────────────────────────────
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
});

export type AppRouter = typeof appRouter;
