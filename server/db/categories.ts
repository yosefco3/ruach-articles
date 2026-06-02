import { and, asc, count, desc, eq } from "drizzle-orm";
import { articles, categories, type InsertCategory } from "../../drizzle/schema";
import { getDb } from "./connection";

const CATEGORY_PALETTE = [
  "#8B6914", "#7C3AED", "#0EA5E9", "#16A34A", "#DC2626", "#EA580C",
  "#DB2777", "#0891B2", "#65A30D", "#9333EA", "#B45309", "#0D9488",
];

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];

  const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);

  const categoriesWithPublishedArticles = await Promise.all(
    allCategories.map(async (cat) => {
      const countResult = await db
        .select({ count: count() })
        .from(articles)
        .where(and(eq(articles.category, cat.slug), eq(articles.published, true)))
        .limit(1);
      return countResult[0]?.count > 0 ? cat : null;
    })
  );

  return categoriesWithPublishedArticles.filter((cat): cat is NonNullable<typeof cat> => cat !== null);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let color = data.color;
  if (!color) {
    const existing = await db.select({ color: categories.color }).from(categories);
    const usedColors = new Set(existing.map((r) => (r.color ?? "").toLowerCase()));
    color = CATEGORY_PALETTE.find((c) => !usedColors.has(c.toLowerCase())) ??
      CATEGORY_PALETTE[existing.length % CATEGORY_PALETTE.length];
  }
  await db.insert(categories).values({ ...data, color });
  const created = await db.select().from(categories).where(eq(categories.slug, data.slug)).limit(1);
  return created.length > 0 ? created[0] : data;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function reorderCategories(items: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      db.update(categories).set({ sortOrder }).where(eq(categories.id, id))
    )
  );
}

export async function reorderCategoryArticles(items: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      db.update(articles).set({ sortOrder }).where(eq(articles.id, id))
    )
  );
}

export async function getCategoriesWithArticleCount() {
  const db = await getDb();
  if (!db) return [];
  const cats = await db.select().from(categories).orderBy(categories.sortOrder);
  const result = await Promise.all(
    cats.map(async (cat) => {
      const countResult = await db
        .select({ count: count() })
        .from(articles)
        .where(and(eq(articles.category, cat.slug), eq(articles.published, true)));
      const latestArticle = await db
        .select({ coverImage: articles.coverImage })
        .from(articles)
        .where(and(eq(articles.category, cat.slug), eq(articles.published, true)))
        .orderBy(desc(articles.createdAt))
        .limit(1);
      return {
        ...cat,
        articleCount: countResult[0]?.count ?? 0,
        latestCoverImage: latestArticle[0]?.coverImage ?? null,
      };
    })
  );
  return result.filter(cat => cat.articleCount > 0);
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}