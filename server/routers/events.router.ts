import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

const slugSchema = z.string().min(1).max(128).refine((v) => !/[\s/?#%]/.test(v), "slug: אותיות, ספרות ומקפים בלבד");

const eventInput = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(256),
  description: z.string().max(2_000_000).nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  location: z.string().max(256).optional(),
  isOnline: z.boolean().optional(),
  registrationUrl: z.union([z.literal(""), z.string().url().max(1024)]).optional(),
  price: z.string().max(64).optional(),
  teacherId: z.number().int().nullable().optional(),
  bookId: z.number().int().nullable().optional(),
  coverImage: z.string().max(1024).nullable().optional(),
  published: z.boolean().optional(),
});

/**
 * אירועים — תשתית נסתרת: הציבור רואה משהו רק כש-siteSettings.eventsVisible דלוק.
 */
export const createEventsRouter = (deps: RouterDeps) =>
  router({
    /** ציבורי: אירועים מפורסמים (קרובים + שהיו), או [] כשהמדור כבוי. */
    list: publicProcedure.query(async () => {
      const settings = await deps.db.getSiteSettings();
      if (!(settings as { eventsVisible?: boolean }).eventsVisible) return { visible: false as const, upcoming: [], past: [] };
      const all = await deps.db.listEvents({ publishedOnly: true });
      const now = Date.now();
      const isPast = (e: { endsAt: Date | null; startsAt: Date }) => new Date(e.endsAt ?? e.startsAt).getTime() < now;
      return {
        visible: true as const,
        upcoming: all.filter((e) => !isPast(e)),
        past: all.filter(isPast).reverse(),
      };
    }),

    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input, ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      const settings = await deps.db.getSiteSettings();
      const visible = !!(settings as { eventsVisible?: boolean }).eventsVisible;
      const e = await deps.db.getEventBySlug(input.slug);
      if (!e || (!isAdmin && (!visible || !e.published))) throw new TRPCError({ code: "NOT_FOUND" });
      return e;
    }),

    listAll: adminProcedure.query(async () => await deps.db.listEvents()),

    create: adminProcedure.input(eventInput).mutation(async ({ input }) => {
      if (await deps.db.getEventBySlug(input.slug)) throw new TRPCError({ code: "CONFLICT", message: "slug כבר קיים" });
      return await deps.db.createEvent(input);
    }),

    update: adminProcedure.input(eventInput.partial().extend({ id: z.number().int() })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      if (data.slug) {
        const clash = await deps.db.getEventBySlug(data.slug);
        if (clash && clash.id !== id) throw new TRPCError({ code: "CONFLICT", message: "slug כבר קיים" });
      }
      const updated = await deps.db.updateEvent(id, data);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

    delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await deps.db.deleteEvent(input.id);
      return { success: true };
    }),
  });
