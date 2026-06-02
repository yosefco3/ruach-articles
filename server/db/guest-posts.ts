import { and, desc, eq } from "drizzle-orm";
import { guestPosts, type InsertGuestPost } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getGuestPosts(status?: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(guestPosts.status, status)] : [];
  return await db.select().from(guestPosts).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(guestPosts.createdAt));
}

export async function createGuestPost(data: InsertGuestPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(guestPosts).values(data);
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    const created = await db.select().from(guestPosts).where(eq(guestPosts.id, insertId)).limit(1);
    if (created.length > 0) return created[0];
  }
  return { id: insertId, ...data, status: "pending" as const, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateGuestPostStatus(id: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(guestPosts).set({ status }).where(eq(guestPosts.id, id));
  const updated = await db.select().from(guestPosts).where(eq(guestPosts.id, id)).limit(1);
  return updated.length > 0 ? updated[0] : null;
}

export async function deleteGuestPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(guestPosts).where(eq(guestPosts.id, id));
}