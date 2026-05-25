import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import {
  getGuestPosts,
  createGuestPost,
  updateGuestPostStatus,
  deleteGuestPost,
} from "../db";

export const guestPostsRouter = router({
  list: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }))
    .query(async ({ input }) => {
      return await getGuestPosts(input.status);
    }),

  submit: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        authorName: z.string(),
        authorEmail: z.string(),
        body: z.string(),
        category: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await createGuestPost(input);
    }),

  approve: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateGuestPostStatus(input.id, "approved");
      return { success: true };
    }),

  reject: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateGuestPostStatus(input.id, "rejected");
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteGuestPost(input.id);
      return { success: true };
    }),
});