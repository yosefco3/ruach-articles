import { eq } from "drizzle-orm";
import { siteSettings, type InsertSiteSettings } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getSiteSettings() {
  const db = await getDb();
  if (!db) return { siteTitle: "רוּחַ", heroSubtitle: "רוחניות · פילוסופיה · ריפוי", contactEmail: null as string | null };
  const rows = await db.select().from(siteSettings).limit(1);
  return rows.length > 0 ? rows[0] : { siteTitle: "רוּחַ", heroSubtitle: "רוחניות · פילוסופיה · ריפוי", contactEmail: null as string | null };
}

export async function updateSiteSettings(data: Partial<InsertSiteSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(siteSettings).limit(1);
  if (rows.length > 0) {
    await db.update(siteSettings).set(data).where(eq(siteSettings.id, rows[0].id));
  } else {
    await db.insert(siteSettings).values(data as InsertSiteSettings);
  }
}