/**
 * 78 קלפי הטארוט — מבנה קבוע. השמות (עברית/אנגלית) הם ברירת מחדל שה-DB יכול
 * לעקוף (tarotCardText.name, "" = fallback), באותה סמנטיקה של האי-צ'ינג.
 * ארבעה קלפים הוסבו בחפיסה המקורית שלנו (החלטת tarot-deck, 2026-09-09):
 * ההיירופנט→הַמּוֹרֶה, המוות→הַמַּעֲבָר, השטן→הַצֵּל, יום הדין→הַהִתְעוֹרְרוּת.
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
  major(5, "המורה", "The Teacher"),
  major(6, "האוהבים", "The Lovers"),
  major(7, "המרכבה", "The Chariot"),
  major(8, "הכוח", "Strength"),
  major(9, "הנזיר", "The Hermit"),
  major(10, "גלגל המזל", "The Wheel"),
  major(11, "הצדק", "Justice"),
  major(12, "התלוי", "The Hanged One"),
  major(13, "המעבר", "The Passage"),
  major(14, "המתינות", "Temperance"),
  major(15, "הצל", "The Shadow"),
  major(16, "המגדל", "The Tower"),
  major(17, "הכוכב", "The Star"),
  major(18, "הירח", "The Moon"),
  major(19, "השמש", "The Sun"),
  major(20, "ההתעוררות", "The Awakening"),
  major(21, "העולם", "The World"),

  minor("wands", "01", "אס המטות", "Ace of Wands"),
  minor("wands", "02", "שניים במטות", "Two of Wands"),
  minor("wands", "03", "שלושה במטות", "Three of Wands"),
  minor("wands", "04", "ארבעה במטות", "Four of Wands"),
  minor("wands", "05", "חמישה במטות", "Five of Wands"),
  minor("wands", "06", "שישה במטות", "Six of Wands"),
  minor("wands", "07", "שבעה במטות", "Seven of Wands"),
  minor("wands", "08", "שמונה במטות", "Eight of Wands"),
  minor("wands", "09", "תשעה במטות", "Nine of Wands"),
  minor("wands", "10", "עשרה במטות", "Ten of Wands"),
  minor("wands", "page", "נער המטות", "Page of Wands"),
  minor("wands", "knight", "אביר המטות", "Knight of Wands"),
  minor("wands", "queen", "מלכת המטות", "Queen of Wands"),
  minor("wands", "king", "מלך המטות", "King of Wands"),

  minor("cups", "01", "אס הגביעים", "Ace of Cups"),
  minor("cups", "02", "שניים בגביעים", "Two of Cups"),
  minor("cups", "03", "שלושה בגביעים", "Three of Cups"),
  minor("cups", "04", "ארבעה בגביעים", "Four of Cups"),
  minor("cups", "05", "חמישה בגביעים", "Five of Cups"),
  minor("cups", "06", "שישה בגביעים", "Six of Cups"),
  minor("cups", "07", "שבעה בגביעים", "Seven of Cups"),
  minor("cups", "08", "שמונה בגביעים", "Eight of Cups"),
  minor("cups", "09", "תשעה בגביעים", "Nine of Cups"),
  minor("cups", "10", "עשרה בגביעים", "Ten of Cups"),
  minor("cups", "page", "נער הגביעים", "Page of Cups"),
  minor("cups", "knight", "אביר הגביעים", "Knight of Cups"),
  minor("cups", "queen", "מלכת הגביעים", "Queen of Cups"),
  minor("cups", "king", "מלך הגביעים", "King of Cups"),

  minor("swords", "01", "אס החרבות", "Ace of Swords"),
  minor("swords", "02", "שניים בחרבות", "Two of Swords"),
  minor("swords", "03", "שלושה בחרבות", "Three of Swords"),
  minor("swords", "04", "ארבעה בחרבות", "Four of Swords"),
  minor("swords", "05", "חמישה בחרבות", "Five of Swords"),
  minor("swords", "06", "שישה בחרבות", "Six of Swords"),
  minor("swords", "07", "שבעה בחרבות", "Seven of Swords"),
  minor("swords", "08", "שמונה בחרבות", "Eight of Swords"),
  minor("swords", "09", "תשעה בחרבות", "Nine of Swords"),
  minor("swords", "10", "עשרה בחרבות", "Ten of Swords"),
  minor("swords", "page", "נער החרבות", "Page of Swords"),
  minor("swords", "knight", "אביר החרבות", "Knight of Swords"),
  minor("swords", "queen", "מלכת החרבות", "Queen of Swords"),
  minor("swords", "king", "מלך החרבות", "King of Swords"),

  minor("pents", "01", "אס המטבעות", "Ace of Pentacles"),
  minor("pents", "02", "שניים במטבעות", "Two of Pentacles"),
  minor("pents", "03", "שלושה במטבעות", "Three of Pentacles"),
  minor("pents", "04", "ארבעה במטבעות", "Four of Pentacles"),
  minor("pents", "05", "חמישה במטבעות", "Five of Pentacles"),
  minor("pents", "06", "שישה במטבעות", "Six of Pentacles"),
  minor("pents", "07", "שבעה במטבעות", "Seven of Pentacles"),
  minor("pents", "08", "שמונה במטבעות", "Eight of Pentacles"),
  minor("pents", "09", "תשעה במטבעות", "Nine of Pentacles"),
  minor("pents", "10", "עשרה במטבעות", "Ten of Pentacles"),
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

/** נתיב התמונה הציבורי של קלף; הנכסים מגיעים מצנרת tarot-deck. */
export function cardImagePath(id: string): string {
  return `/tarot-cards/${id}.webp`;
}

export const CARD_BACK_IMAGE = "/tarot-cards/back.webp";
