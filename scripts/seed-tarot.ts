/**
 * זריעת תוכן ראשוני לטארוט (idempotent, אל-דריסה).
 * הרצה: pnpm seed:tarot  (טוען .env.local דרך node --env-file)
 *
 * המקור: scripts/data/tarot-seed.json (committed) — נגזר מפרויקט tarot-deck.
 * מדיניות: לעולם לא דורסים טקסט שאדמין ערך —
 *  - summary/interpretation נכתבים רק כשהשדה ריק ב-DB (או שאין שורה).
 *  - intro נזרע רק כשאין שורת intro כלל.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CARDS } from "../shared/tarot";
import { getCardText, getTarotIntro, upsertCardText, updateTarotIntro } from "../server/db/tarot";
import { getDb } from "../server/db/connection";

interface SeedData {
  intro: {
    articleHtml: string;
    questionPrompt: string;
    questionHint: string;
    buttonLabel: string;
  };
  cards: { id: string; summary: string; interpretationHtml?: string }[];
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SEED_PATH = path.join(HERE, "data", "tarot-seed.json");

export function loadSeed(): SeedData {
  return JSON.parse(readFileSync(SEED_PATH, "utf-8")) as SeedData;
}

/** מאמת שהזרע מכסה בדיוק את 78 הקלפים של shared/tarot, בלי זרים. */
export function validateSeed(data: SeedData): void {
  const structIds = new Set(CARDS.map((c) => c.id));
  const seedIds = new Set(data.cards.map((c) => c.id));
  const missing = [...structIds].filter((id) => !seedIds.has(id));
  const foreign = [...seedIds].filter((id) => !structIds.has(id));
  if (missing.length || foreign.length || data.cards.length !== CARDS.length) {
    throw new Error(
      `tarot seed mismatch — missing: [${missing.join(", ")}], foreign: [${foreign.join(", ")}]`,
    );
  }
  for (const c of data.cards) {
    if (!c.summary?.trim()) throw new Error(`empty summary for ${c.id}`);
    if (c.summary.length > 512) throw new Error(`summary too long for ${c.id}`);
  }
}

async function main() {
  const data = loadSeed();
  validateSeed(data);

  const db = await getDb();
  if (!db) throw new Error("Database not available — is MySQL up? (docker compose up -d)");

  let seeded = 0;
  let skipped = 0;
  for (const card of data.cards) {
    const existing = await getCardText(card.id);
    const summaryEmpty = !existing?.summary?.trim();
    const interpEmpty = !existing?.interpretation?.trim();
    const wantInterp = card.interpretationHtml?.trim() ?? "";
    if (!summaryEmpty && (!interpEmpty || !wantInterp)) {
      skipped++;
      continue;
    }
    await upsertCardText({
      cardId: card.id,
      name: existing?.name ?? "",
      summary: summaryEmpty ? card.summary : existing!.summary,
      interpretation: interpEmpty && wantInterp ? wantInterp : (existing?.interpretation ?? ""),
    });
    seeded++;
  }

  // intro — רק אם אין עדיין שורה ב-DB (getTarotIntro מחזיר את ברירת המחדל בלי id).
  const intro = await getTarotIntro();
  const hasRow = "id" in intro;
  if (!hasRow) {
    await updateTarotIntro(data.intro);
    console.log("intro: seeded");
  } else {
    console.log("intro: exists — skipped");
  }

  console.log(`cards: ${seeded} seeded, ${skipped} skipped (already edited)`);
  process.exit(0);
}

// הרצה ישירה בלבד (לא בזמן import מטסטים)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
