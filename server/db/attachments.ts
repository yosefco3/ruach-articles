import { desc, eq } from "drizzle-orm";
import { attachments, type InsertAttachment } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getAttachmentsByArticle(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(attachments).where(eq(attachments.articleId, articleId)).orderBy(desc(attachments.uploadedAt));
}

export async function createAttachment(data: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(attachments).values(data);
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(attachments).where(eq(attachments.id, id));
}

export async function deleteAttachmentsByArticle(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(attachments).where(eq(attachments.articleId, articleId));
}