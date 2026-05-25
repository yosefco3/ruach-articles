import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import {
  getAboutPage,
  updateAboutPage,
} from "../db";

export const aboutRouter = router({
  get: publicProcedure.query(async () => {
    return await getAboutPage();
  }),

  update: adminProcedure
    .input(z.object({ title: z.string(), content: z.string(), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      await updateAboutPage({ title: input.title, content: input.content, imageUrl: input.imageUrl ?? null });
      return await getAboutPage();
    }),
});