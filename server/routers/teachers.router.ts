import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

const slugSchema = z.string().min(1).max(128).refine((v) => !/[\s/?#%]/.test(v), "slug: אותיות, ספרות ומקפים בלבד");

/** שדות שהמורה עצמו רשאי לערוך בפרופיל שלו. */
const selfEditable = {
  photo: z.string().max(1024).nullable().optional(),
  tagline: z.string().max(512).optional(),
  area: z.string().max(256).optional(),
  formats: z.string().max(256).optional(),
  bio: z.string().max(2_000_000).nullable().optional(),
  quote: z.string().max(2000).nullable().optional(),
  website: z.union([z.literal(""), z.string().url().max(1024)]).optional(),
  publicEmail: z.union([z.literal(""), z.string().email().max(320)]).optional(),
  phone: z.string().max(64).optional(),
  contactEmail: z.union([z.literal(""), z.string().email().max(320)]).optional(),
};

const teacherInput = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(256),
  isFounder: z.boolean().optional(),
  visible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  ...selfEditable,
});

/** הצורה הציבורית: בלי המייל המוסתר ובלי מזהה החשבון. */
function toPublic<T extends { contactEmail: string; userId: number | null }>(t: T) {
  const { contactEmail: _c, userId: _u, ...rest } = t;
  return { ...rest, hasContact: !!_c };
}

export const createTeachersRouter = (deps: RouterDeps) =>
  router({
    list: publicProcedure.query(async () => {
      const rows = await deps.db.listTeachers({ visibleOnly: true });
      return rows.map(toPublic);
    }),

    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input, ctx }) => {
      const t = await deps.db.getTeacherBySlug(input.slug);
      if (!t || (!t.visible && ctx.user?.role !== "admin")) throw new TRPCError({ code: "NOT_FOUND" });
      return toPublic(t);
    }),

    /** המאמרים המפורסמים של מורה. */
    articlesOf: publicProcedure.input(z.object({ teacherId: z.number().int() })).query(async ({ input }) => {
      return await deps.db.getTeacherArticles(input.teacherId, { publishedOnly: true });
    }),

    /** הפרופיל של המשתמש המחובר אם הוא מורה מקושר — אחרת null. */
    me: protectedProcedure.query(async ({ ctx }) => {
      const t = await deps.db.getTeacherByUserId(ctx.user.dbId);
      return t ?? null;
    }),

    updateMe: protectedProcedure.input(z.object(selfEditable)).mutation(async ({ input, ctx }) => {
      const t = await deps.db.getTeacherByUserId(ctx.user.dbId);
      if (!t) throw new TRPCError({ code: "FORBIDDEN", message: "אינך מורה מקושר" });
      return await deps.db.updateTeacher(t.id, input);
    }),

    listAll: adminProcedure.query(async () => await deps.db.listTeachers()),

    create: adminProcedure.input(teacherInput).mutation(async ({ input }) => {
      if (await deps.db.getTeacherBySlug(input.slug)) throw new TRPCError({ code: "CONFLICT", message: "slug כבר קיים" });
      return await deps.db.createTeacher(input);
    }),

    update: adminProcedure.input(teacherInput.partial().extend({ id: z.number().int() })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      if (data.slug) {
        const clash = await deps.db.getTeacherBySlug(data.slug);
        if (clash && clash.id !== id) throw new TRPCError({ code: "CONFLICT", message: "slug כבר קיים" });
      }
      const updated = await deps.db.updateTeacher(id, data);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

    /** קישור מורה לחשבון גוגל לפי מייל — החשבון חייב להתחבר לאתר פעם אחת קודם. */
    linkUser: adminProcedure.input(z.object({ id: z.number().int(), email: z.string().email() })).mutation(async ({ input }) => {
      const user = await deps.db.getUserByEmail(input.email);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "לא נמצא חשבון עם המייל הזה — המורה צריך להתחבר לאתר פעם אחת" });
      const taken = await deps.db.getTeacherByUserId(user.id);
      if (taken && taken.id !== input.id) throw new TRPCError({ code: "CONFLICT", message: "החשבון כבר מקושר למורה אחר" });
      return await deps.db.updateTeacher(input.id, { userId: user.id });
    }),

    unlinkUser: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      return await deps.db.updateTeacher(input.id, { userId: null });
    }),

    delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await deps.db.deleteTeacher(input.id);
      return { success: true };
    }),

    reorder: adminProcedure.input(z.object({ ids: z.array(z.number().int()).max(200) })).mutation(async ({ input }) => {
      await deps.db.reorderTeachers(input.ids);
      return { success: true };
    }),
  });
