import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import {
  getSiteSettings,
  updateSiteSettings,
} from "../db";

export const settingsRouter = router({
  get: publicProcedure.query(async () => {
    return await getSiteSettings();
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
      await updateSiteSettings(input);
      return await getSiteSettings();
    }),
});