import { eq } from "drizzle-orm";
import {
  tarotCardText,
  tarotIntro,
  type InsertTarotCardText,
  type InsertTarotIntro,
} from "../../drizzle/schema";
import { getDb } from "./connection";

export const DEFAULT_TAROT_INTRO = {
  articleHtml: "",
  questionPrompt: "מה השאלה שמעסיקה אותך?",
  questionHint: "השאלה אישית ואינה נשמרת בשום מקום.",
  buttonLabel: "עִרְבְּבוּ וְשִׁלְפוּ קְלָפִים",
  aiEnabled: false,
};

// ── Card text ──
export async function listCardTexts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tarotCardText);
}
export async function getCardText(cardId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(tarotCardText)
    .where(eq(tarotCardText.cardId, cardId))
    .limit(1);
  return rows[0];
}
/** upsert לפי cardId (PK). */
export async function upsertCardText(data: InsertTarotCardText) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getCardText(data.cardId);
  if (existing) {
    await db.update(tarotCardText).set(data).where(eq(tarotCardText.cardId, data.cardId));
  } else {
    await db.insert(tarotCardText).values(data);
  }
}

// ── Intro singleton ──
export async function getTarotIntro() {
  const db = await getDb();
  if (!db) return DEFAULT_TAROT_INTRO;
  const rows = await db.select().from(tarotIntro).limit(1);
  return rows[0] ?? DEFAULT_TAROT_INTRO;
}
export async function updateTarotIntro(data: Partial<InsertTarotIntro>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(tarotIntro).limit(1);
  if (rows.length) {
    await db.update(tarotIntro).set(data).where(eq(tarotIntro.id, rows[0].id));
  } else {
    await db.insert(tarotIntro).values(data as InsertTarotIntro);
  }
}
