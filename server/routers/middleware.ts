import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../_core/trpc";
import type { AuthUser } from "../_core/auth/types";
import type { RouterDeps } from "./context";

/**
 * Admin-only procedure guard
 * Requires user to have admin role
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({ ctx });
});

/**
 * Writer procedure guard
 * Allows admin OR approved guest writers (legacy flow, removed in site-pivot step 13)
 */
export const writerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const isAdmin = ctx.user.role === "admin";
  const isApprovedWriter = (ctx.user as any).guestPostApproved === true;
  if (!isAdmin && !isApprovedWriter) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({ ctx });
});

/**
 * Who may write articles (site-pivot-books): the admin, a teacher whose account is
 * linked (teachers.userId), or — until the guest-post flow is deleted — an approved
 * guest writer. Resolves the teacher row once and hands it down as ctx.teacher.
 */
export const makeTeacherProcedure = (db: RouterDeps["db"]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const isAdmin = ctx.user.role === "admin";
    const teacher = isAdmin ? undefined : await db.getTeacherByUserId(ctx.user.dbId);
    const isApprovedWriter = (ctx.user as any).guestPostApproved === true;
    if (!isAdmin && !teacher && !isApprovedWriter) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    }
    return next({ ctx: { ...ctx, teacher: teacher ?? null } });
  });

/**
 * Ownership guard for a single article: admins may touch any article, everyone
 * else only the ones they authored. Returns the article so callers can reuse it.
 */
export async function assertCanEditArticle(
  db: RouterDeps["db"],
  user: AuthUser,
  articleId: number,
) {
  const article = await db.getArticleById(articleId);
  if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "מאמר לא נמצא" });
  if (user.role !== "admin" && article.authorId !== user.dbId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return article;
}