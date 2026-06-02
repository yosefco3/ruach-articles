import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

export const createSettingsRouter = (deps: RouterDeps) => router({
  get: publicProcedure.query(async () => {
    return await deps.db.getSiteSettings();
  }),

  update: adminProcedure
    .input(
      z.object({
        siteTitle: z.string().optional(),
        heroSubtitle: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input }) => {
      await deps.db.updateSiteSettings(input);
      return await deps.db.getSiteSettings();
    }),
});