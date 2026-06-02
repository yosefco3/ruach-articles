import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function approveGuestWriter(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ guestPostApproved: true }).where(eq(users.id, userId));
}

export async function revokeGuestWriter(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ guestPostApproved: false }).where(eq(users.id, userId));
}

export async function getApprovedGuestWriters() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.guestPostApproved, true));
}