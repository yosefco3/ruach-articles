import { eq } from "drizzle-orm";
import {
  ichingHexagramText,
  ichingTrigramText,
  ichingIntro,
  type InsertIchingHexagramText,
  type InsertIchingTrigramText,
  type InsertIchingIntro,
} from "../../drizzle/schema";
import { getDb } from "./connection";

const DEFAULT_INTRO = {
  articleHtml: "",
  questionPrompt: "מה ברצונך לשאול?",
  questionHint: "השאלה אישית ואינה נשמרת בשום מקום.",
  buttonLabel: "הַטֵּל אֶת הַמַּטְבְּעוֹת",
  refineEnabled: true,
};

// ── Hexagram text ──
export async function listHexagramTexts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ichingHexagramText);
}
export async function getHexagramText(number: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(ichingHexagramText)
    .where(eq(ichingHexagramText.number, number))
    .limit(1);
  return rows[0];
}
/** upsert לפי number (PK). */
export async function upsertHexagramText(data: InsertIchingHexagramText) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getHexagramText(data.number);
  if (existing) {
    await db
      .update(ichingHexagramText)
      .set(data)
      .where(eq(ichingHexagramText.number, data.number));
  } else {
    await db.insert(ichingHexagramText).values(data);
  }
}

// ── Trigram text ──
export async function listTrigramTexts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ichingTrigramText);
}
export async function upsertTrigramText(data: InsertIchingTrigramText) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(ichingTrigramText)
    .where(eq(ichingTrigramText.trigramKey, data.trigramKey))
    .limit(1);
  if (rows.length) {
    await db
      .update(ichingTrigramText)
      .set(data)
      .where(eq(ichingTrigramText.trigramKey, data.trigramKey));
  } else {
    await db.insert(ichingTrigramText).values(data);
  }
}

// ── Intro singleton ──
export async function getIchingIntro() {
  const db = await getDb();
  if (!db) return DEFAULT_INTRO;
  const rows = await db.select().from(ichingIntro).limit(1);
  return rows[0] ?? DEFAULT_INTRO;
}
export async function updateIchingIntro(data: Partial<InsertIchingIntro>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(ichingIntro).limit(1);
  if (rows.length) {
    await db.update(ichingIntro).set(data).where(eq(ichingIntro.id, rows[0].id));
  } else {
    await db.insert(ichingIntro).values(data as InsertIchingIntro);
  }
}
