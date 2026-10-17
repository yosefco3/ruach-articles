/**
 * ספרים — ההיגיון הטהור המשותף ל-client ול-server (site-pivot-books).
 * המבנה (טבלת books) ב-drizzle/schema.ts; כאן: סטטוסים, קישורי רכישה, תוכן עניינים.
 */

export const BOOK_STATUSES = ["writing", "coming_soon", "available"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  writing: "בכתיבה",
  coming_soon: "בקרוב",
  available: "זמין לרכישה",
};

export const PURCHASE_KINDS = ["print", "ebook", "audio", "other"] as const;
export type PurchaseKind = (typeof PURCHASE_KINDS)[number];

export const PURCHASE_KIND_LABELS: Record<PurchaseKind, string> = {
  print: "ספר מודפס",
  ebook: "ספר דיגיטלי",
  audio: "ספר שמע",
  other: "קישור",
};

/** קישור רכישה אחד — הוצאה, בוקפוד, "עברית"… נתוני אדמין, לא קוד. */
export interface PurchaseLink {
  label: string;
  url: string;
  kind: PurchaseKind;
}

function isHttpUrl(u: unknown): u is string {
  return typeof u === "string" && /^https?:\/\/\S+$/i.test(u);
}

/**
 * מפענח את עמודת purchaseLinks (JSON) בסובלנות: null/ריק/JSON שבור/פריטים לא
 * תקינים → נזרקים בשקט. לעולם לא זורק — דף ספר לא נשבר בגלל שדה אדמין.
 */
export function parsePurchaseLinks(raw: string | null | undefined): PurchaseLink[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: PurchaseLink[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const { label, url, kind } = item as Record<string, unknown>;
    if (typeof label !== "string" || !label.trim() || !isHttpUrl(url)) continue;
    const k = (PURCHASE_KINDS as readonly string[]).includes(String(kind))
      ? (kind as PurchaseKind)
      : "other";
    out.push({ label: label.trim(), url, kind: k });
  }
  return out;
}

export function serializePurchaseLinks(links: PurchaseLink[]): string {
  return JSON.stringify(parsePurchaseLinks(JSON.stringify(links)));
}

/** תוכן עניינים — מערך שורות; מפוענח בסובלנות כמו הקישורים. */
export function parseToc(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string" && s.trim() !== "").map((s) => s.trim())
      : [];
  } catch {
    return [];
  }
}

/** טקסט תוכן-עניינים מהטופס (שורה לפריט) → JSON לשמירה. */
export function tocFromLines(text: string): string {
  return JSON.stringify(
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  );
}

/**
 * מה מציג אזור ה-CTA בדף הספר: כפתורי רכישה רק כשהספר זמין *ויש* קישורים;
 * אחרת "עדכנו אותי" (הניוזלטר). available בלי קישורים = עדיין "בקרוב" למבקר.
 */
export function bookCta(
  status: BookStatus,
  links: PurchaseLink[],
): { kind: "buy"; links: PurchaseLink[] } | { kind: "notify"; label: string } {
  if (status === "available" && links.length > 0) return { kind: "buy", links };
  return {
    kind: "notify",
    label: status === "writing" ? "הספר בכתיבה — עדכנו אותי כשיצא" : "עדכנו אותי כשהספר יוצא",
  };
}
