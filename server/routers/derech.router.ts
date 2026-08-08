import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

/** צורת התוכן של דף הדרך — ולידציה מלאה לפני שמירה (ראו shared/derech.ts). */
const principleSchema = z.object({
  title: z.string().min(1).max(200),
  law: z.string().min(1).max(500),
  body: z.string().min(1).max(5000),
});

const derechContentSchema = z.object({
  title: z.string().min(1).max(200),
  tagline: z.string().max(200),
  subtitle: z.string().max(300),
  opening: z.array(z.string().max(5000)).max(10),
  principlesTitle: z.string().max(200),
  principlesSubtitle: z.string().max(300),
  principles: z.array(principleSchema).min(1).max(10),
  inOutTitle: z.string().max(200),
  inOutSubtitle: z.string().max(300),
  inItems: z.array(z.string().max(1000)).max(20),
  outItems: z.array(z.string().max(1000)).max(20),
  closingQuote: z.string().max(2000),
  closingCta: z.string().max(300),
});

export const createDerechRouter = (deps: RouterDeps) =>
  router({
    /** התוכן השמור, או null ⇒ הלקוח מציג את ברירת המחדל המובנית. */
    get: publicProcedure.query(async () => {
      return await deps.db.getDerechContent();
    }),

    update: adminProcedure.input(derechContentSchema).mutation(async ({ input }) => {
      await deps.db.updateDerechContent(input);
      return await deps.db.getDerechContent();
    }),
  });
