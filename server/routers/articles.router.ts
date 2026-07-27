import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateSlug, randomSlug } from "@shared/slug";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { adminProcedure, writerProcedure, assertCanEditArticle } from "./middleware";
import type { RouterDeps } from "./context";

export const createArticlesRouter = (deps: RouterDeps) => router({
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
      const articles = await deps.db.getArticles({
        category: input?.category,
        published: all ? undefined : true,
      });
      return articles;
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const article = await deps.db.getArticleBySlug(input.slug);
      if (!article) return null;
      const attachments = await deps.db.getAttachmentsByArticle(article.id);
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
      return await deps.db.getNextArticleInCategory(input.currentSlug, input.category);
    }),

  // Get random article
  random: publicProcedure
    .input(
      z.object({
        excludeId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await deps.db.getRandomArticle(input.excludeId);
    }),

  create: writerProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        body: z.string().min(1),
        coverImage: z.string().optional(),
        category: z.string().min(1),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Prefer the supplied slug; otherwise generate a random one. Not derived
      // from the title.
      let slug = generateSlug(input.slug ?? "") || randomSlug();

      // Ensure slug uniqueness by appending a random suffix on the rare collision.
      for (let i = 0; i < 5 && (await deps.db.getArticleBySlug(slug)); i++) {
        slug = slug + "-" + randomSlug(4);
      }
      
      return await deps.db.createArticle({
        ...input,
        slug,
        authorId: ctx.user!.dbId,
        published: false,
      });
    }),

  // Any signed-in user may edit an article they authored; admins may edit any.
  update: protectedProcedure
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
    .mutation(async ({ input, ctx }) => {
      const { id, siteUrl: _siteUrl, ...data } = input;
      await assertCanEditArticle(deps.db, ctx.user, id);
      // Publishing stays an admin decision — an author editing their own article
      // cannot flip the flag, so the review flow can't be self-approved.
      if (ctx.user.role !== "admin") delete (data as { published?: boolean }).published;
      const updated = await deps.db.updateArticle(id, data);
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
      const article = await deps.db.getArticleById(input.articleId);
      if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "מאמר לא נמצא" });
      await deps.sendArticleNewsletter({
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
      await deps.db.deleteArticle(input.id);
      return { success: true };
    }),

   reorder: adminProcedure
    .input(
      z.object({
        items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
      })
    )
    .mutation(async ({ input }) => {
      await deps.db.reorderArticles(input.items);
      return { success: true };
    }),
  // Save attachment metadata after file upload to S3
  addAttachment: protectedProcedure
    .input(
      z.object({
        articleId: z.number(),
        fileName: z.string().min(1),
        fileUrl: z.string().url(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertCanEditArticle(deps.db, ctx.user, input.articleId);
      await deps.db.createAttachment({
        articleId: input.articleId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
      });
      return { success: true };
    }),
  // Delete an attachment — same reach as editing the article it belongs to
  deleteAttachment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const attachment = await deps.db.getAttachmentById(input.id);
      if (!attachment) throw new TRPCError({ code: "NOT_FOUND", message: "קובץ לא נמצא" });
      await assertCanEditArticle(deps.db, ctx.user, attachment.articleId);
      await deps.db.deleteAttachment(input.id);
      return { success: true };
    }),
});