import { desc, eq, like } from "drizzle-orm";
import { newsletterSubscribers, type InsertNewsletterSubscriber } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function subscribeToNewsletter(data: InsertNewsletterSubscriber) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, data.email)).limit(1);
  if (existing.length > 0) {
    if (!existing[0].active) {
      await db.update(newsletterSubscribers).set({ active: true, name: data.name }).where(eq(newsletterSubscribers.id, existing[0].id));
    }
    return existing[0];
  }
  await db.insert(newsletterSubscribers).values(data);
  const created = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, data.email)).limit(1);
  return created.length > 0 ? created[0] : data;
}

export async function unsubscribeFromNewsletter(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(newsletterSubscribers).set({ active: false }).where(eq(newsletterSubscribers.email, email));
}

export async function getNewsletterSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
}

export async function deleteNewsletterSubscriber(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
}

export async function searchNewsletterSubscribers(emailQuery: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(newsletterSubscribers)
    .where(like(newsletterSubscribers.email, `%${emailQuery}%`))
    .orderBy(desc(newsletterSubscribers.subscribedAt));
}