// Hebrew → Latin transliteration map used to build URL slugs from Hebrew titles.
const HEBREW_TRANSLIT: Record<string, string> = {
  א: "a", ב: "b", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z",
  ח: "ch", ט: "t", י: "y", כ: "k", ך: "k", ל: "l", מ: "m",
  ם: "m", נ: "n", ן: "n", ס: "s", ע: "a", פ: "p", ף: "p",
  צ: "tz", ץ: "tz", ק: "k", ר: "r", ש: "sh", ת: "t",
};

/**
 * Build a URL slug composed only of lowercase English letters, digits and
 * hyphens. Hebrew letters are transliterated to Latin; niqqud/cantillation and
 * any other non-[a-z0-9] characters are dropped. Returns "" when nothing
 * usable remains (callers should provide their own fallback).
 */
export function generateSlug(text: string): string {
  return (text || "")
    .trim()
    .toLowerCase()
    // strip Hebrew niqqud / cantillation marks
    .replace(/[֑-ׇ]/g, "")
    // transliterate Hebrew letters to Latin
    .replace(/[א-ת]/g, (ch) => HEBREW_TRANSLIT[ch] ?? "")
    // spaces and underscores become hyphens
    .replace(/[\s_]+/g, "-")
    // drop anything that isn't a-z, 0-9 or hyphen
    .replace(/[^a-z0-9-]/g, "")
    // collapse and trim hyphens
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a random slug made of lowercase English letters. Used as the default
 * URL for a new article — not derived from the title. The server still enforces
 * uniqueness, but the random space makes collisions practically impossible.
 */
export function randomSlug(length = 10): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  let out = "";
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  } else {
    for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
