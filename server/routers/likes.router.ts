import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import type { RouterDeps } from "./context";

export const createLikesRouter = (deps: RouterDeps) => router({
  toggle: protectedProcedure
    .input(
      z.object({
        articleId: z.number().optional(),
        commentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await deps.db.getUserLike(ctx.user!.dbId, input.articleId, input.commentId);
      if (existing) {
        await deps.db.deleteLike(existing.id);
        return { liked: false };
      } else {
        await deps.db.createLike({
          userId: ctx.user!.dbId,
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
      return await deps.db.getLikeCount(input.articleId, input.commentId);
    }),

  userLike: protectedProcedure
    .input(
      z.object({
        articleId: z.number().optional(),
        commentId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await deps.db.getUserLike(ctx.user!.dbId, input.articleId, input.commentId);
    }),
});