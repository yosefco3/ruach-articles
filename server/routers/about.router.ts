import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

export const createAboutRouter = (deps: RouterDeps) => router({
  get: publicProcedure.query(async () => {
    return await deps.db.getAboutPage();
  }),

  update: adminProcedure
    .input(z.object({ title: z.string(), content: z.string(), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      await deps.db.updateAboutPage({ title: input.title, content: input.content, imageUrl: input.imageUrl ?? null });
      return await deps.db.getAboutPage();
    }),
});