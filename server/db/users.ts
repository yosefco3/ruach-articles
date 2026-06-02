import { eq, desc } from "drizzle-orm";
import { users, type InsertUser } from "../../drizzle/schema";
import { env } from "../_core/env";
import { getDb } from "./connection";

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const existingUser = await getUserByOpenId(user.openId);
  
  if (existingUser) {
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      updateSet[field] = value ?? null;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) { updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { updateSet.role = user.role; }
    else if (user.email && user.email === env.ADMIN_EMAIL) { updateSet.role = "admin"; }
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
  } else {
    const values: InsertUser = { openId: user.openId };
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; }
    else if (user.email && user.email === env.ADMIN_EMAIL) { values.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();

    await db.insert(users).values(values);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      guestPostApproved: users.guestPostApproved,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}