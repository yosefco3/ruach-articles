/**
 * 78 קלפי הטארוט — מבנה קבוע. השמות (עברית/אנגלית) הם ברירת מחדל שה-DB יכול
 * לעקוף (tarotCardText.name, "" = fallback), באותה סמנטיקה של האי-צ'ינג.
 * השמות מסורתיים (החלטת tarot-deck, 2026-09-09); האיורים צמודים לקומפוזיציות
 * של ריידר-וייט, רק בלי צלבים ובלי עירום (החלטת 2026-09-10).
 * אין UI/DB כאן — קוד טהור משותף ל-client+server.
 */

export type Arcana = "major" | "minor";
export type Suit = "wands" | "cups" | "swords" | "pents";
export type Rank =
  | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10"
  | "page" | "knight" | "queen" | "king";

export interface CardStruct {
  id: string; // "major-00" | "wands-03" | "pents-queen" — תואם לשמות קובצי התמונות
  arcana: Arcana;
  number?: number; // 0..21, ארקנה גדולה בלבד
  suit?: Suit; // ארקנה קטנה בלבד
  rank?: Rank; // ארקנה קטנה בלבד
  he: string; // שם עברי ברירת-מחדל (override ב-DB)
  en: string; // שם אנגלי
}

export const SUITS: Record<Suit, { he: string; element: string }> = {
  wands: { he: "מטות", element: "אש" },
  cups: { he: "גביעים", element: "מים" },
  swords: { he: "חרבות", element: "אוויר" },
  pents: { he: "מטבעות", element: "אדמה" },
};

const major = (number: number, he: string, en: string): CardStruct => ({
  id: `major-${String(number).padStart(2, "0")}`,
  arcana: "major",
  number,
  he,
  en,
});

const minor = (suit: Suit, rank: Rank, he: string, en: string): CardStruct => ({
  id: `${suit}-${rank}`,
  arcana: "minor",
  suit,
  rank,
  he,
  en,
});

export const CARDS: CardStruct[] = [
  major(0, "השוטה", "The Fool"),
  major(1, "הקוסם", "The Magician"),
  major(2, "הכוהנת", "The Priestess"),
  major(3, "הקיסרית", "The Empress"),
  major(4, "הקיסר", "The Emperor"),
  major(5, "הכהן הגדול", "The Hierophant"),
  major(6, "האוהבים", "The Lovers"),
  major(7, "המרכבה", "The Chariot"),
  major(8, "הכוח", "Strength"),
  major(9, "הנזיר", "The Hermit"),
  major(10, "גלגל המזל", "The Wheel"),
  major(11, "הצדק", "Justice"),
  major(12, "האיש התלוי", "The Hanged One"),
  major(13, "המוות", "Death"),
  major(14, "האיזון", "Temperance"),
  major(15, "השטן", "The Devil"),
  major(16, "המגדל הבוער", "The Tower"),
  major(17, "הכוכב", "The Star"),
  major(18, "הירח", "The Moon"),
  major(19, "השמש", "The Sun"),
  major(20, "יום הדין", "Judgement"),
  major(21, "העולם", "The World"),

  minor("wands", "01", "אס המטות", "Ace of Wands"),
  minor("wands", "02", "שני מטות", "Two of Wands"),
  minor("wands", "03", "שלושה מטות", "Three of Wands"),
  minor("wands", "04", "ארבעה מטות", "Four of Wands"),
  minor("wands", "05", "חמישה מטות", "Five of Wands"),
  minor("wands", "06", "שישה מטות", "Six of Wands"),
  minor("wands", "07", "שבעה מטות", "Seven of Wands"),
  minor("wands", "08", "שמונה מטות", "Eight of Wands"),
  minor("wands", "09", "תשעה מטות", "Nine of Wands"),
  minor("wands", "10", "עשרה מטות", "Ten of Wands"),
  minor("wands", "page", "נער המטות", "Page of Wands"),
  minor("wands", "knight", "אביר המטות", "Knight of Wands"),
  minor("wands", "queen", "מלכת המטות", "Queen of Wands"),
  minor("wands", "king", "מלך המטות", "King of Wands"),

  minor("cups", "01", "אס הגביעים", "Ace of Cups"),
  minor("cups", "02", "שני גביעים", "Two of Cups"),
  minor("cups", "03", "שלושה גביעים", "Three of Cups"),
  minor("cups", "04", "ארבעה גביעים", "Four of Cups"),
  minor("cups", "05", "חמישה גביעים", "Five of Cups"),
  minor("cups", "06", "שישה גביעים", "Six of Cups"),
  minor("cups", "07", "שבעה גביעים", "Seven of Cups"),
  minor("cups", "08", "שמונה גביעים", "Eight of Cups"),
  minor("cups", "09", "תשעה גביעים", "Nine of Cups"),
  minor("cups", "10", "עשרה גביעים", "Ten of Cups"),
  minor("cups", "page", "נער הגביעים", "Page of Cups"),
  minor("cups", "knight", "אביר הגביעים", "Knight of Cups"),
  minor("cups", "queen", "מלכת הגביעים", "Queen of Cups"),
  minor("cups", "king", "מלך הגביעים", "King of Cups"),

  minor("swords", "01", "אס החרבות", "Ace of Swords"),
  minor("swords", "02", "שתי חרבות", "Two of Swords"),
  minor("swords", "03", "שלוש חרבות", "Three of Swords"),
  minor("swords", "04", "ארבע חרבות", "Four of Swords"),
  minor("swords", "05", "חמש חרבות", "Five of Swords"),
  minor("swords", "06", "שש חרבות", "Six of Swords"),
  minor("swords", "07", "שבע חרבות", "Seven of Swords"),
  minor("swords", "08", "שמונה חרבות", "Eight of Swords"),
  minor("swords", "09", "תשע חרבות", "Nine of Swords"),
  minor("swords", "10", "עשר חרבות", "Ten of Swords"),
  minor("swords", "page", "נער החרבות", "Page of Swords"),
  minor("swords", "knight", "אביר החרבות", "Knight of Swords"),
  minor("swords", "queen", "מלכת החרבות", "Queen of Swords"),
  minor("swords", "king", "מלך החרבות", "King of Swords"),

  minor("pents", "01", "אס המטבעות", "Ace of Pentacles"),
  minor("pents", "02", "שני מטבעות", "Two of Pentacles"),
  minor("pents", "03", "שלושה מטבעות", "Three of Pentacles"),
  minor("pents", "04", "ארבעה מטבעות", "Four of Pentacles"),
  minor("pents", "05", "חמישה מטבעות", "Five of Pentacles"),
  minor("pents", "06", "שישה מטבעות", "Six of Pentacles"),
  minor("pents", "07", "שבעה מטבעות", "Seven of Pentacles"),
  minor("pents", "08", "שמונה מטבעות", "Eight of Pentacles"),
  minor("pents", "09", "תשעה מטבעות", "Nine of Pentacles"),
  minor("pents", "10", "עשרה מטבעות", "Ten of Pentacles"),
  minor("pents", "page", "נער המטבעות", "Page of Pentacles"),
  minor("pents", "knight", "אביר המטבעות", "Knight of Pentacles"),
  minor("pents", "queen", "מלכת המטבעות", "Queen of Pentacles"),
  minor("pents", "king", "מלך המטבעות", "King of Pentacles"),
];

export const CARD_BY_ID: ReadonlyMap<string, CardStruct> = new Map(
  CARDS.map((c) => [c.id, c]),
);

export function cardById(id: string): CardStruct | undefined {
  return CARD_BY_ID.get(id);
}

/**
 * Slug ל-URL של דף הקלף (/tarot/card/<slug>) — נגזר משם ה-en הקנוני:
 * "The Fool" → "the-fool", "Ace of Wands" → "ace-of-wands". ייחודי לכל 78.
 */
export function cardSlug(card: CardStruct): string {
  return card.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const CARD_BY_SLUG: ReadonlyMap<string, CardStruct> = new Map(
  CARDS.map((c) => [cardSlug(c), c]),
);

export function cardBySlug(slug: string): CardStruct | undefined {
  return CARD_BY_SLUG.get(slug);
}

/**
 * גרסת נכסי החפיסה — מעלים אותה אחרי כל החלפת תמונות כדי לעקוף את מטמון
 * ה-CDN (Cloudflare) והדפדפן: שם הקובץ נשאר, ה-query string משתנה.
 */
export const DECK_ASSETS_VERSION = 12;

/** נתיב התמונה הציבורי של קלף; הנכסים מגיעים מצנרת tarot-deck. */
export function cardImagePath(id: string): string {
  return `/tarot-cards/${id}.webp?v=${DECK_ASSETS_VERSION}`;
}

export const CARD_BACK_IMAGE = `/tarot-cards/back.webp?v=${DECK_ASSETS_VERSION}`;
