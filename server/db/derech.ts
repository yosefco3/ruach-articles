import { eq } from "drizzle-orm";
import { derechPage } from "../../drizzle/schema";
import { getDb } from "./connection";
import type { DerechContent } from "@shared/derech";

/**
 * מחזיר את תוכן דף הדרך מה-DB, או null כשאין שורה / אין DB / הטבלה עוד לא
 * קיימת (פרודקשן לפני הרצת 0016-derech-prod.sql). null ⇒ הלקוח מציג את
 * DEFAULT_DERECH_CONTENT, כך שהדף הציבורי לעולם לא נשבר.
 */
export async function getDerechContent(): Promise<DerechContent | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(derechPage).limit(1);
    if (rows.length === 0 || !rows[0].content) return null;
    return JSON.parse(rows[0].content) as DerechContent;
  } catch (err) {
    console.warn("[derech] getDerechContent failed (missing table?):", err);
    return null;
  }
}

export async function updateDerechContent(content: DerechContent): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const json = JSON.stringify(content);
  const rows = await db.select().from(derechPage).limit(1);
  if (rows.length > 0) {
    await db.update(derechPage).set({ content: json }).where(eq(derechPage.id, rows[0].id));
  } else {
    await db.insert(derechPage).values({ content: json });
  }
}
