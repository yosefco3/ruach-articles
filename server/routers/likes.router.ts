import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  getLikeCount,
  getUserLike,
  createLike,
  deleteLike,
} from "../db";

export const likesRouter = router({
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