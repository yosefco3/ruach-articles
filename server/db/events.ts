import { asc, desc, eq } from "drizzle-orm";
import { events, type InsertEvent } from "../../drizzle/schema";
import { getDb } from "./connection";

/** אירועים (site-pivot-books). קריאה סובלנית לטבלה חסרה. */
export async function listEvents(opts?: { publishedOnly?: boolean }) {
  try {
    const db = await getDb();
    if (!db) return [];
    const q = db.select().from(events).orderBy(asc(events.startsAt));
    return opts?.publishedOnly ? await q.where(eq(events.published, true)) : await q;
  } catch (err) {
    console.warn("[events] listEvents failed (missing table?):", err);
    return [];
  }
}

export async function getEventBySlug(slug: string) {
  try {
    const db = await getDb();
    if (!db) return undefined;
    const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
    return rows[0];
  } catch (err) {
    console.warn("[events] getEventBySlug failed (missing table?):", err);
    return undefined;
  }
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0];
}

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(events).values(data);
  const created = await getEventBySlug(data.slug);
  if (!created) throw new Error("Event insert failed");
  return created;
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set(data).where(eq(events.id, id));
  return getEventById(id);
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events).where(eq(events.id, id));
}

/** האירועים האחרונים שהסתיימו — לדף "אירועים שהיו". */
export async function listPastEvents(limit = 20) {
  try {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(events).where(eq(events.published, true)).orderBy(desc(events.startsAt)).limit(limit);
  } catch {
    return [];
  }
}
