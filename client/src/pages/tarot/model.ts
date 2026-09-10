/**
 * לוגיקת מיזוג מבנה (shared/tarot) + טקסט (DB) עבור דף הקריאה — טהורה וניתנת לבדיקה.
 * הקומפוננטות (TarotReading/TarotCard) דקות מעל המודול הזה.
 */
import {
  CARDS,
  SUITS,
  cardById,
  cardImagePath,
  type CardStruct,
  type TarotReading,
} from "@shared/tarot";
import { htmlToPlainText } from "@/pages/iching/model";

export interface CardTextRow {
  cardId: string;
  name: string; // override לשם; ריק = ברירת המחדל מ-shared
  summary: string;
  interpretation: string;
}
export interface TarotIntro {
  articleHtml: string;
  questionPrompt: string;
  questionHint: string;
  buttonLabel: string;
  /** מתג ראשי לפירוש ה-AI (toggle מפאנל האדמין). */
  aiEnabled: boolean;
}
export interface TarotContent {
  cards: CardTextRow[];
  intro: TarotIntro;
  /** מכסת פירושי ה-AI החודשית למשתמש רשום (TAROT_AI_MONTHLY_LIMIT). */
  aiMonthlyLimit: number;
}

export function findCardText(rows: CardTextRow[], cardId: string): CardTextRow | undefined {
  return rows.find((r) => r.cardId === cardId);
}

/** שם הקלף כפי שיוצג: override מה-DB אם קיים, אחרת השם העברי מ-shared. */
export function effectiveCardName(struct: CardStruct, row?: CardTextRow): string {
  return row?.name.trim() ? row.name : struct.he;
}

/** תווית הסדרה למיינור: "מטות · אש". למייג'ור — "אַרְקָנָה גְּדוֹלָה". */
export function suitLabel(struct: CardStruct): string {
  if (struct.arcana === "major" || !struct.suit) return "אַרְקָנָה גְּדוֹלָה";
  const s = SUITS[struct.suit];
  return `${s.he} · ${s.element}`;
}

/** קלף שלוף אחד, ממוזג ומוכן לרינדור. */
export interface CardView {
  id: string;
  name: string;
  en: string;
  summary: string;
  interpretationHtml: string;
  imageUrl: string;
  suitLabel: string;
}

export function toCardViews(reading: TarotReading, content: TarotContent): CardView[] {
  return reading.cards.map((d) => {
    const row = findCardText(content.cards, d.card.id);
    return {
      id: d.card.id,
      name: effectiveCardName(d.card, row),
      en: d.card.en,
      summary: row?.summary ?? "",
      interpretationHtml: row?.interpretation ?? "",
      imageUrl: cardImagePath(d.card.id),
      suitLabel: suitLabel(d.card),
    };
  });
}

/** ה-view שחלון הפירוט היחיד מציג; null כשלא נבחר קלף. */
export function resolvePanel(views: CardView[], selected: number | null): CardView | null {
  if (selected === null || selected < 0 || selected >= views.length) return null;
  return views[selected];
}

// ── הזרקת קונטקסט לפירוש ה-AI: מחלצים מהתוכן הסטטי שכבר בעמוד ──

export interface TarotAiCardContext {
  name: string;
  summary: string;
  text: string;
}

/** מרכיב את קונטקסט שלושת הקלפים להזרקה — בסדר השליפה, HTML → טקסט נקי. */
export function buildAiContext(views: CardView[]): TarotAiCardContext[] {
  return views.map((v) => ({
    name: v.name,
    summary: v.summary,
    text: htmlToPlainText(v.interpretationHtml),
  }));
}

/** placeholder כשתמונת הקלף עוד לא הועלתה: שם + סמל לפי הקבוצה. */
export function cardFallbackGlyph(cardId: string): string {
  const struct = cardById(cardId);
  if (!struct || struct.arcana === "major") return "✶";
  return { wands: "🜂", cups: "🜄", swords: "🜁", pents: "🜃" }[struct.suit!];
}

// ── דף הגלריה (/tarot/deck): חלוקת החפיסה לקבוצות תצוגה ──

export interface DeckSection {
  key: string;
  /** "אַרְקָנָה גְּדוֹלָה" או "מָטוֹת · אֵשׁ" */
  title: string;
  cards: CardStruct[];
}

/** 5 קבוצות בסדר קבוע: ארקנה גדולה ואז ארבע הסדרות (בסדר SUITS). */
export function deckSections(): DeckSection[] {
  const majors = CARDS.filter((c) => c.arcana === "major");
  const suits = (Object.keys(SUITS) as (keyof typeof SUITS)[]).map((suit) => ({
    key: suit,
    title: `${SUITS[suit].he} · ${SUITS[suit].element}`,
    cards: CARDS.filter((c) => c.suit === suit),
  }));
  return [{ key: "major", title: "אַרְקָנָה גְּדוֹלָה", cards: majors }, ...suits];
}
