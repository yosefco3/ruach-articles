import { z } from "zod";
import { router } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import {
  approveGuestWriter,
  revokeGuestWriter,
  getApprovedGuestWriters,
} from "../db";

export const guestWritersRouter = router({
  list: adminProcedure.query(async () => {
    return await getApprovedGuestWriters();
  }),

  approve: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await approveGuestWriter(input.userId);
      return { success: true };
    }),

  revoke: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await revokeGuestWriter(input.userId);
      return { success: true };
    }),
});