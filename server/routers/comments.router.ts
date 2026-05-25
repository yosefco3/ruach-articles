import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { DEFAULT_FROM_EMAIL } from "@shared/const";
import {
  getCommentsByArticle,
  getCommentById,
  createComment,
  deleteComment,
  getArticleById,
  getSiteSettings,
} from "../db";

export const commentsRouter = router({
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
        siteUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const comment = await createComment({
        articleId: input.articleId,
        userId: ctx.user!.id,
        body: input.body,
        parentCommentId: input.parentCommentId,
      });

      // Notify owner about new comment via email (fire-and-forget)
      try {
        const article = await getArticleById(input.articleId);
        if (article) {
          const commenterName = ctx.user!.name || ctx.user!.email || "משתמש";
          const articleLink = input.siteUrl ? `${input.siteUrl}/article/${article.slug}` : `/article/${article.slug}`;

          // Send email if contactEmail is configured
          const settings = await getSiteSettings();
          const adminEmail = settings.contactEmail;
          if (adminEmail) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || DEFAULT_FROM_EMAIL;
            await resend.emails.send({
              from: `${settings.siteTitle || "רוּחַ חָכְמָה"} <${FROM_EMAIL}>`,
              to: adminEmail,
              subject: `תגובה חדשה: ${article.title}`,
              html: `<div dir="rtl" style="font-family:Arial,sans-serif;background:#1a1008;color:#f0e6d0;padding:32px;border-radius:12px;max-width:600px;">
  <h2 style="color:#c9a84c;">תגובה חדשה על המאמר</h2>
  <p><strong>מאמר:</strong> <a href="${articleLink}" style="color:#c9a84c;">${article.title}</a></p>
  <p><strong>מגיב:</strong> ${commenterName}</p>
  <div style="background:#231508;border-radius:8px;padding:16px;margin:16px 0;border-right:4px solid #c9a84c;">
    <p style="margin:0;">${input.body.replace(/\n/g, "<br/>")}</p>
  </div>
  <a href="${articleLink}" style="display:inline-block;background:#8B6914;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;">עבור למאמר</a>
</div>`,
            });
          }
        }
      } catch (err) {
        // Non-critical — log but don't fail the comment creation
        console.warn("[Comment] Failed to send owner notification:", err);
      }

      return comment;
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