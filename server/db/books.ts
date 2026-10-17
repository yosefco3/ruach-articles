import { asc, eq } from "drizzle-orm";
import { books, type InsertBook } from "../../drizzle/schema";
import { getDb } from "./connection";

/**
 * ספרים (site-pivot-books). כל השאילתות סובלניות לטבלה חסרה (פרודקשן לפני
 * 0020-books-prod.sql): קריאה → [] / undefined, כך שדף ציבורי לעולם לא נשבר.
 */
export async function listBooks(opts?: { visibleOnly?: boolean }) {
  try {
    const db = await getDb();
    if (!db) return [];
    const q = db.select().from(books).orderBy(asc(books.sortOrder), asc(books.id));
    const rows = opts?.visibleOnly ? await q.where(eq(books.visible, true)) : await q;
    return rows;
  } catch (err) {
    console.warn("[books] listBooks failed (missing table?):", err);
    return [];
  }
}

export async function getBookBySlug(slug: string) {
  try {
    const db = await getDb();
    if (!db) return undefined;
    const rows = await db.select().from(books).where(eq(books.slug, slug)).limit(1);
    return rows[0];
  } catch (err) {
    console.warn("[books] getBookBySlug failed (missing table?):", err);
    return undefined;
  }
}

export async function getBookById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(books).where(eq(books.id, id)).limit(1);
  return rows[0];
}

export async function createBook(data: InsertBook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(books).values(data);
  const created = await getBookBySlug(data.slug);
  if (!created) throw new Error("Book insert failed");
  return created;
}

export async function updateBook(id: number, data: Partial<InsertBook>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(books).set(data).where(eq(books.id, id));
  return getBookById(id);
}

export async function deleteBook(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(books).where(eq(books.id, id));
}

/** סדר תצוגה — המערך הוא הסדר החדש (index = sortOrder). */
export async function reorderBooks(ids: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (let i = 0; i < ids.length; i++) {
    await db.update(books).set({ sortOrder: i }).where(eq(books.id, ids[i]));
  }
}
