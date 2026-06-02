import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

export const createNewsletterRouter = (deps: RouterDeps) => router({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await deps.db.subscribeToNewsletter(input);
      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      await deps.db.unsubscribeFromNewsletter(input.email);
      return { success: true };
    }),

  list: adminProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.search && input.search.trim()) {
        return await deps.db.searchNewsletterSubscribers(input.search.trim());
      }
      return await deps.db.getNewsletterSubscribers();
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deps.db.deleteNewsletterSubscriber(input.id);
      return { success: true };
    }),
});