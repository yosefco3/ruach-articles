import { z } from "zod";
import { router } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

export const createGuestWritersRouter = (deps: RouterDeps) => router({
  list: adminProcedure.query(async () => {
    return await deps.db.getApprovedGuestWriters();
  }),

  approve: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await deps.db.approveGuestWriter(input.userId);
      return { success: true };
    }),

  revoke: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await deps.db.revokeGuestWriter(input.userId);
      return { success: true };
    }),
});