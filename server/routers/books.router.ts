import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";
import { BOOK_STATUSES, parsePurchaseLinks, parseToc } from "@shared/books";

const slugSchema = z
  .string()
  .min(1)
  .max(128)
  // אותיות (כולל עברית), ספרות ומקפים בלבד — בלי רווחים/סלאשים.
  .refine((v) => !/[\s/?#%]/.test(v), "slug: אותיות, ספרות ומקפים בלבד");

const purchaseLinkSchema = z.object({
  label: z.string().min(1).max(120),
  url: z.string().url().max(1024),
  kind: z.enum(["print", "ebook", "audio", "other"]),
});

const bookInputSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(256),
  subtitle: z.string().max(512).optional(),
  blurb: z.string().max(2_000_000).optional(),
  coverImage: z.string().max(1024).nullable().optional(),
  status: z.enum(BOOK_STATUSES).optional(),
  visible: z.boolean().optional(),
  publisher: z.string().max(256).optional(),
  purchaseLinks: z.array(purchaseLinkSchema).max(20).optional(),
  toc: z.array(z.string().max(300)).max(200).optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  pages: z.number().int().min(1).max(5000).nullable().optional(),
  isbn: z.string().max(32).optional(),
  sortOrder: z.number().int().optional(),
});

/** שורת DB → צורה ציבורית: JSON מפוענח, בלי להעביר את המחרוזות הגולמיות. */
function toPublic<T extends { purchaseLinks: string | null; tocJson: string | null }>(row: T) {
  const { purchaseLinks, tocJson, ...rest } = row;
  return { ...rest, purchaseLinks: parsePurchaseLinks(purchaseLinks), toc: parseToc(tocJson) };
}

type BookInput = z.infer<typeof bookInputSchema>;
function toDb<T extends Partial<BookInput>>(input: T) {
  const { purchaseLinks, toc, ...rest } = input;
  return {
    ...rest,
    ...(purchaseLinks !== undefined ? { purchaseLinks: JSON.stringify(purchaseLinks) } : {}),
    ...(toc !== undefined ? { tocJson: JSON.stringify(toc) } : {}),
  } as Omit<T, "purchaseLinks" | "toc"> & { purchaseLinks?: string; tocJson?: string };
}

export const createBooksRouter = (deps: RouterDeps) =>
  router({
    /** ציבורי: רק ספרים גלויים, לפי sortOrder. */
    list: publicProcedure.query(async () => {
      const rows = await deps.db.listBooks({ visibleOnly: true });
      return rows.map(toPublic);
    }),

    /** ציבורי: ספר לפי slug. לא-גלוי → NOT_FOUND למבקר, נראה לאדמין (תצוגה מקדימה). */
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input, ctx }) => {
      const row = await deps.db.getBookBySlug(input.slug);
      if (!row || (!row.visible && ctx.user?.role !== "admin")) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Book not found" });
      }
      return toPublic(row);
    }),

    listAll: adminProcedure.query(async () => {
      const rows = await deps.db.listBooks();
      return rows.map(toPublic);
    }),

    create: adminProcedure.input(bookInputSchema).mutation(async ({ input }) => {
      const existing = await deps.db.getBookBySlug(input.slug);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "slug כבר קיים" });
      const created = await deps.db.createBook(toDb(input));
      return toPublic(created);
    }),

    update: adminProcedure
      .input(bookInputSchema.partial().extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.slug) {
          const clash = await deps.db.getBookBySlug(data.slug);
          if (clash && clash.id !== id) throw new TRPCError({ code: "CONFLICT", message: "slug כבר קיים" });
        }
        const updated = await deps.db.updateBook(id, toDb(data));
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        return toPublic(updated);
      }),

    delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
      await deps.db.deleteBook(input.id);
      return { success: true };
    }),

    reorder: adminProcedure.input(z.object({ ids: z.array(z.number().int()).max(100) })).mutation(async ({ input }) => {
      await deps.db.reorderBooks(input.ids);
      return { success: true };
    }),
  });
