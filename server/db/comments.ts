import { desc, eq } from "drizzle-orm";
import { comments, users, type InsertComment } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getCommentsByArticle(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: comments.id, articleId: comments.articleId, userId: comments.userId,
    body: comments.body, parentCommentId: comments.parentCommentId,
    createdAt: comments.createdAt, userName: users.name,
  }).from(comments).leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.articleId, articleId)).orderBy(desc(comments.createdAt));
}

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(data);
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    const created = await db.select().from(comments).where(eq(comments.id, insertId)).limit(1);
    if (created.length > 0) return created[0];
  }
  return { id: insertId, ...data, createdAt: new Date() };
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(comments).where(eq(comments.id, id));
}

export async function getCommentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}