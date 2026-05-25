import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  getUserCommentCount,
} from "../db";

export const profilesRouter = router({
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