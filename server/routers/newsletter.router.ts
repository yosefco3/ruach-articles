import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getNewsletterSubscribers,
  deleteNewsletterSubscriber,
  searchNewsletterSubscribers,
} from "../db";

export const newsletterRouter = router({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await subscribeToNewsletter(input);
      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      await unsubscribeFromNewsletter(input.email);
      return { success: true };
    }),

  list: adminProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.search && input.search.trim()) {
        return await searchNewsletterSubscribers(input.search.trim());
      }
      return await getNewsletterSubscribers();
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteNewsletterSubscriber(input.id);
      return { success: true };
    }),
});