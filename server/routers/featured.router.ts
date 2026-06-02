import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

export const createFeaturedRouter = (deps: RouterDeps) => router({
  get: publicProcedure.query(async () => {
    return await deps.db.getFeaturedArticle();
  }),

  set: adminProcedure
    .input(z.object({ articleId: z.number() }))
    .mutation(async ({ input }) => {
      await deps.db.setFeaturedArticle(input.articleId);
      return { success: true };
    }),
});