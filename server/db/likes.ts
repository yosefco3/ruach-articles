import { and, eq, sql } from "drizzle-orm";
import { likes, type InsertLike } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getLikeCount(articleId?: number, commentId?: number) {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [];
  if (articleId) conditions.push(eq(likes.articleId, articleId));
  if (commentId) conditions.push(eq(likes.commentId, commentId));
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(likes)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  return Number(result[0]?.count ?? 0);
}

export async function getUserLike(userId: number, articleId?: number, commentId?: number) {
  const db = await getDb();
  if (!db) return null;
  const conditions = [eq(likes.userId, userId)];
  if (articleId) conditions.push(eq(likes.articleId, articleId));
  if (commentId) conditions.push(eq(likes.commentId, commentId));
  const rows = await db.select().from(likes).where(and(...conditions)).limit(1);
  return rows.length > 0 ? rows[0] : null;
}

export async function createLike(data: InsertLike) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(likes).values(data);
}

export async function deleteLike(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(likes).where(eq(likes.id, id));
}