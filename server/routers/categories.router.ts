import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

export const createCategoriesRouter = (deps: RouterDeps) => {
  const { db } = deps;

  return router({
    list: publicProcedure.query(async () => {
      return await db.getCategories();
    }),

    listAll: adminProcedure.query(async () => {
      return await db.getAllCategories();
    }),

    listWithCounts: publicProcedure.query(async () => {
      return await db.getCategoriesWithArticleCount();
    }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getCategoryBySlug(input.slug);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          color: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createCategory(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          color: z.string().optional(),
          sortOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),
    reorder: adminProcedure
      .input(
        z.object({
          items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
        })
      )
      .mutation(async ({ input }) => {
        await db.reorderCategories(input.items);
        return { success: true };
      }),
  });
};