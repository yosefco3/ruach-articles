import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import {
  getFeaturedArticle,
  setFeaturedArticle,
} from "../db";

export const featuredArticleRouter = router({
  get: publicProcedure.query(async () => {
    return await getFeaturedArticle();
  }),

  set: adminProcedure
    .input(z.object({ articleId: z.number() }))
    .mutation(async ({ input }) => {
      await setFeaturedArticle(input.articleId);
      return { success: true };
    }),
});