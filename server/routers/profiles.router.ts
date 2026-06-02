import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import type { RouterDeps } from "./context";

export const createProfilesRouter = (deps: RouterDeps) => router({
  get: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await deps.db.getUserProfile(input.userId);
      const commentCount = await deps.db.getUserCommentCount(input.userId);
      return { profile, commentCount };
    }),

  update: protectedProcedure
    .input(z.object({ bio: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await deps.db.getUserProfile(ctx.user!.dbId);
      if (!existing) {
        await deps.db.createUserProfile({ userId: ctx.user!.dbId, bio: input.bio });
      } else {
        await deps.db.updateUserProfile(ctx.user!.dbId, { bio: input.bio });
      }
      return { success: true };
    }),
});