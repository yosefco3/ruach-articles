import { z } from "zod";
import { TRPCError } from "@trpc/server";
import slugify from "slugify";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure, writerProcedure } from "./middleware";
import {
  getArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getAttachmentsByArticle,
  createAttachment,
  deleteAttachment,
  reorderArticles,
  getNextArticleInCategory,
  getRandomArticle,
} from "../db";
import { sendArticleNewsletter } from "../newsletterEmail";

export const articlesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
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

  // Get next article in same category
  nextInCategory: publicProcedure
    .input(
      z.object({
        currentSlug: z.string(),
        category: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getNextArticleInCategory(input.currentSlug, input.category);
    }),

  // Get random article
  random: publicProcedure
    .input(
      z.object({
        excludeId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getRandomArticle(input.excludeId);
    }),

  create: writerProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string(),
        excerpt: z.string().optional(),
        body: z.string().min(1),
        coverImage: z.string().optional(),
        category: z.string().min(1),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Server-side slug normalization using slugify with Hebrew support
      let slug = slugify(input.slug, {
        lower: true,
        strict: true,
        locale: 'he',
        remove: /[*+~.()'"!:@]/g,
      });
      
      // Fallback to timestamp-based slug if slugify produces empty result
      if (!slug || slug === "-") {
        slug = "article-" + Date.now().toString(36);
      }
      
      // Ensure slug uniqueness by appending a suffix if needed
      const existing = await getArticleBySlug(slug);
      if (existing) {
        slug = slug + "-" + Date.now().toString(36);
      }
      
      return await createArticle({
        ...input,
        slug,
        authorId: ctx.user!.dbId,
        published: false,
      });
    }),

  update: writerProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        body: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        published: z.boolean().optional(),
        siteUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, siteUrl: _siteUrl, ...data } = input;
      const updated = await updateArticle(id, data);
      return updated;
    }),

  sendNewsletter: adminProcedure
    .input(
      z.object({
        articleId: z.number(),
        siteUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const article = await getArticleById(input.articleId);
      if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "מאמר לא נמצא" });
      await sendArticleNewsletter({
        title: article.title,
        excerpt: article.excerpt,
        slug: article.slug,
        coverImage: article.coverImage,
        category: article.category,
        siteUrl: input.siteUrl,
      });
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteArticle(input.id);
      return { success: true };
    }),

   reorder: adminProcedure
    .input(
      z.object({
        items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
      })
    )
    .mutation(async ({ input }) => {
      await reorderArticles(input.items);
      return { success: true };
    }),
  // Save attachment metadata after file upload to S3
  addAttachment: writerProcedure
    .input(
      z.object({
        articleId: z.number(),
        fileName: z.string().min(1),
        fileUrl: z.string().url(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await createAttachment({
        articleId: input.articleId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
      });
      return { success: true };
    }),
  // Delete an attachment (admin only)
  deleteAttachment: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAttachment(input.id);
      return { success: true };
    }),
});