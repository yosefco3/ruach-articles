import { and, asc, desc, eq, sql } from "drizzle-orm";
import { articles, users, attachments, comments, likes, type InsertArticle } from "../../drizzle/schema";
import { getDb } from "./connection";
import { safeDeleteObject } from "./storage-cleanup";

export async function getArticles(opts?: { category?: string; published?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.published !== undefined) conditions.push(eq(articles.published, opts.published));
  if (opts?.category) {
    conditions.push(eq(articles.category, opts.category));
  }
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      coverImage: articles.coverImage,
      category: articles.category,
      tags: articles.tags,
      published: articles.published,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorId: articles.authorId,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(articles.sortOrder), desc(articles.createdAt));
  return rows;
}

export async function getNextArticleInCategory(currentSlug: string, category: string) {
  const db = await getDb();
  if (!db) return undefined;
  const articlesInCategory = await db
    .select({
      id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt,
      coverImage: articles.coverImage, category: articles.category, tags: articles.tags,
      createdAt: articles.createdAt, sortOrder: articles.sortOrder, authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.category, category), eq(articles.published, true)))
    .orderBy(asc(articles.sortOrder), desc(articles.createdAt));
  const currentIndex = articlesInCategory.findIndex(a => a.slug === currentSlug);
  if (currentIndex !== -1 && currentIndex < articlesInCategory.length - 1) {
    return articlesInCategory[currentIndex + 1];
  }
  return undefined;
}

export async function getRandomArticle(excludeId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(articles.published, true)];
  if (excludeId) { conditions.push(sql`${articles.id} != ${excludeId}`); }
  const allArticles = await db
    .select({
      id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt,
      coverImage: articles.coverImage, category: articles.category, tags: articles.tags,
      createdAt: articles.createdAt, authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(...conditions));
  if (allArticles.length === 0) return undefined;
  return allArticles[Math.floor(Math.random() * allArticles.length)];
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({
    id: articles.id, title: articles.title, slug: articles.slug, excerpt: articles.excerpt,
    body: articles.body, coverImage: articles.coverImage, category: articles.category,
    tags: articles.tags, published: articles.published, createdAt: articles.createdAt,
    updatedAt: articles.updatedAt, authorId: articles.authorId, authorName: users.name,
  }).from(articles).leftJoin(users, eq(articles.authorId, users.id)).where(eq(articles.slug, slug)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function createArticle(data: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articles).values(data);
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    const created = await db.select().from(articles).where(eq(articles.id, insertId)).limit(1);
    if (created.length > 0) return created[0];
  }
  return { success: true };
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Collect the files to remove (attachment files + cover image) before deleting rows.
  const atts = await db.select().from(attachments).where(eq(attachments.articleId, id));
  const articleRows = await db
    .select({ coverImage: articles.coverImage })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  await db.delete(attachments).where(eq(attachments.articleId, id));
  await db.delete(comments).where(eq(comments.articleId, id));
  await db.delete(likes).where(eq(likes.articleId, id));
  await db.delete(articles).where(eq(articles.id, id));

  // Best-effort file cleanup. Inline body images become unreferenced too — those are
  // swept by scripts/cleanup-orphan-images.ts rather than parsed on this hot path.
  for (const a of atts) await safeDeleteObject(a.fileUrl);
  await safeDeleteObject(articleRows[0]?.coverImage);
}

export async function reorderArticles(items: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await Promise.all(items.map(({ id, sortOrder }) => db.update(articles).set({ sortOrder }).where(eq(articles.id, id))));
}