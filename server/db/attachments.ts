import { desc, eq } from "drizzle-orm";
import { attachments, type InsertAttachment } from "../../drizzle/schema";
import { getDb } from "./connection";
import { safeDeleteObject } from "./storage-cleanup";

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
  // Read the file URL before removing the row, then delete the underlying file.
  const rows = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
  await db.delete(attachments).where(eq(attachments.id, id));
  if (rows[0]) await safeDeleteObject(rows[0].fileUrl);
}

export async function deleteAttachmentsByArticle(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(attachments).where(eq(attachments.articleId, articleId));
  await db.delete(attachments).where(eq(attachments.articleId, articleId));
  for (const row of rows) await safeDeleteObject(row.fileUrl);
}