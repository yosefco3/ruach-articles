/**
 * הורדת החפיסה — ZIP חופשי לכולם ב-/tarot-cards/ruach-tarot-deck.zip.
 * נבנה בעצלנות מקובצי הנכסים שכבר פרוסים (לא נשמר ב-git), עם cache בזיכרון
 * שמתבטל כשקובצי התיקייה משתנים. אם קיימת תת-תיקיית print/ (PNG ברזולוציה
 * מלאה) — היא מועדפת על ה-webp המוקטן.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import { buildStoreZip, type ZipEntry } from "./_core/zip";

export const DECK_ZIP_ROUTE = "/tarot-cards/ruach-tarot-deck.zip";
export const DECK_ZIP_ROUTE_EN = "/tarot-cards/ruach-tarot-deck-en.zip";

export type DeckVariant = "he" | "en";

const IMAGE_EXTS = new Set([".webp", ".png", ".jpg", ".jpeg"]);

function readmeText(): string {
  return [
    "חפיסת הטארוט של רוּחַ — Ruach Tarot Deck",
    "========================================",
    "",
    "78 קלפים + גב, שצוירו במקור עבור ruachwisdom.org בסגנון גואש —",
    "חפיסה מקורית, ללא סמלים דתיים וללא עירום.",
    "",
    "השימוש בחפיסה חופשי — להורדה, להדפסה, לשיתוף וליצירה, בתנאי אחד:",
    "בכל פרסום או שימוש פומבי יש לציין את רוּחַ (ruachwisdom.org) כמקור",
    "ולצרף קישור פעיל לאתר: https://ruachwisdom.org/tarot",
    "(ברוח רישיון CC BY 4.0).",
    "",
    "---",
    "",
    "The Ruach Tarot Deck — 78 cards + back, originally painted for",
    "ruachwisdom.org in gouache style. An original deck with no religious",
    "imagery and no nudity.",
    "",
    "Free to download, print, share and build upon, under one condition:",
    "any public use must credit Ruach (ruachwisdom.org) as the source and",
    "include an active link to the site: https://ruachwisdom.org/tarot",
    "(in the spirit of CC BY 4.0).",
    "",
  ].join("\n");
}

/** תיקיית הנכסים: dev (client/public) או prod (dist/public), הראשונה שקיימת. */
async function resolveAssetsDir(): Promise<string | null> {
  const candidates = [
    path.resolve(process.cwd(), "client/public/tarot-cards"),
    path.resolve(process.cwd(), "dist/public/tarot-cards"),
  ];
  for (const dir of candidates) {
    try {
      const st = await fs.stat(dir);
      if (st.isDirectory()) return dir;
    } catch {
      /* לא קיימת — הלאה */
    }
  }
  return null;
}

async function listImages(dir: string): Promise<string[]> {
  const names = await fs.readdir(dir);
  return names.filter((n) => IMAGE_EXTS.has(path.extname(n).toLowerCase())).sort();
}

/** חתימת mtime מצטברת של התיקייה — לצורך ביטול ה-cache כשקבצים מתחלפים. */
async function dirSignature(dir: string, files: string[]): Promise<string> {
  const stats = await Promise.all(files.map((f) => fs.stat(path.join(dir, f))));
  return files.map((f, i) => `${f}:${stats[i].mtimeMs}:${stats[i].size}`).join("|");
}

const caches: Partial<Record<DeckVariant, { signature: string; zip: Buffer }>> = {};

/** לבדיקות: איפוס ה-cache. */
export function resetDeckZipCache(): void {
  delete caches.he;
  delete caches.en;
}

/** בונה (או מחזיר מה-cache) את ה-ZIP; null כשאין נכסים כלל. */
export async function buildDeckZip(baseDir?: string, variant: DeckVariant = "he"): Promise<Buffer | null> {
  const root = baseDir ?? (await resolveAssetsDir());
  if (!root) return null;

  let dir = root;
  if (variant === "en") {
    // הגרסה עם השמות באנגלית חיה בתת-תיקיית en/
    dir = path.join(root, "en");
    try {
      if (!(await fs.stat(dir)).isDirectory()) return null;
    } catch {
      return null;
    }
  } else {
    // print/ עם קבצים → מעדיפים את גרסת ההדפסה המלאה
    try {
      const printDir = path.join(root, "print");
      if ((await fs.stat(printDir)).isDirectory() && (await listImages(printDir)).length > 0) {
        dir = printDir;
      }
    } catch {
      /* אין print/ */
    }
  }

  const files = await listImages(dir);
  if (files.length === 0) return null;

  const signature = `${dir}::${await dirSignature(dir, files)}`;
  const cached = caches[variant];
  if (cached?.signature === signature) return cached.zip;

  const entries: ZipEntry[] = [
    { name: "README.txt", data: Buffer.from(readmeText(), "utf-8") },
  ];
  for (const f of files) {
    entries.push({ name: f, data: await fs.readFile(path.join(dir, f)) });
  }
  const zip = buildStoreZip(entries);
  caches[variant] = { signature, zip };
  return zip;
}

function makeServeDeckZip(variant: DeckVariant, filename: string) {
  return async (_req: Request, res: Response): Promise<void> => {
    try {
      const zip = await buildDeckZip(undefined, variant);
      if (!zip) {
        res.status(404).send("Deck assets are not available yet.");
        return;
      }
      res
        .status(200)
        .set({
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "public, max-age=3600",
        })
        .send(zip);
    } catch (err) {
      console.error("[tarot] deck zip failed:", err);
      res.status(500).send("Failed to build the deck archive.");
    }
  };
}

export const serveDeckZip = makeServeDeckZip("he", "ruach-tarot-deck.zip");
export const serveDeckZipEn = makeServeDeckZip("en", "ruach-tarot-deck-en.zip");
