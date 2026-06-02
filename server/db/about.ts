import { eq } from "drizzle-orm";
import { aboutPage, type InsertAboutPage } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getAboutPage() {
  const db = await getDb();
  if (!db) return { id: 1, title: "אודות", content: "" };
  const rows = await db.select().from(aboutPage).limit(1);
  return rows.length > 0 ? rows[0] : { id: 1, title: "אודות", content: "" };
}

export async function updateAboutPage(data: Partial<InsertAboutPage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(aboutPage).limit(1);
  if (rows.length > 0) {
    await db.update(aboutPage).set(data).where(eq(aboutPage.id, rows[0].id));
  } else {
    await db.insert(aboutPage).values(data as InsertAboutPage);
  }
}