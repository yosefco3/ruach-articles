/**
 * לוגיקת מיזוג מבנה (shared/tarot) + טקסט (DB) עבור דף הקריאה — טהורה וניתנת לבדיקה.
 * הקומפוננטות (TarotReading/TarotCard) דקות מעל המודול הזה.
 */
import {
  CARDS,
  MAX_CHOICE_OPTIONS,
  SUITS,
  cardById,
  cardBySlug,
  cardImagePath,
  cardSlug,
  drawMore,
  optionLetter,
  type CardStruct,
  type Rng,
  type SpreadChoice,
  type SpreadPlan,
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

/** ממזג קלף אחד (מבנה) עם הטקסט הערוך שלו מה-DB. */
export function toCardView(struct: CardStruct, content: TarotContent): CardView {
  const row = findCardText(content.cards, struct.id);
  return {
    id: struct.id,
    name: effectiveCardName(struct, row),
    en: struct.en,
    summary: row?.summary ?? "",
    interpretationHtml: row?.interpretation ?? "",
    imageUrl: cardImagePath(struct.id),
    suitLabel: suitLabel(struct),
  };
}

export function toCardViews(reading: TarotReading, content: TarotContent): CardView[] {
  return reading.cards.map((d) => toCardView(d.card, content));
}

/** ה-view שחלון הפירוט היחיד מציג; null כשלא נבחר קלף. */
export function resolvePanel(views: CardView[], selected: number | null): CardView | null {
  if (selected === null || selected < 0 || selected >= views.length) return null;
  return views[selected];
}

// ── פריסה לפי תוכנית: קיבוץ אינדקסי הקלפים לתצוגה ──

export interface ChoiceColumn {
  /** "א׳", "ב׳"… */
  letter: string;
  /** ניסוח האופציה כפי שה-AI זיקק אותה. */
  option: string;
  /** אינדקסי הקלפים (בסדר השליפה) השייכים לדרך זו: [מה מציעה, לאן מובילה]. */
  indices: number[];
}

export interface ChoiceLayout {
  now: number;
  columns: ChoiceColumn[];
  hidden: number;
}

/**
 * מקבץ את עמדות פריסת הבחירה לתצוגה: הצומת → עמודה לכל דרך → מה שאינך רואה.
 * null לתוכנית שאינה choice (הפריסה הרגילה מוצגת בשורה אחת).
 */
export function choiceLayout(plan: SpreadPlan): ChoiceLayout | null {
  if (plan.kind !== "choice") return null;
  const now = plan.positions.findIndex((p) => p.key === "now");
  const hidden = plan.positions.findIndex((p) => p.key === "hidden");
  const columns = plan.options.map((option, i) => ({
    letter: optionLetter(i),
    option,
    indices: plan.positions.map((p, idx) => (p.option === i ? idx : -1)).filter((idx) => idx >= 0),
  }));
  return { now, columns, hidden };
}

/**
 * הודעה לשואל כשזוהו בשאלה יותר אפשרויות ממה שפריסת הבחירה משווה, ולכן נפרסו שלושה
 * קלפים. null כשאין חריגה. בלי ההודעה הזו שלושת הקלפים נראים כמו תקלה.
 */
export function overflowNotice(spread: SpreadChoice): string | null {
  const n = spread.overflow;
  if (spread.kind !== "three" || !n || n <= MAX_CHOICE_OPTIONS) return null;
  return (
    `זיהינו בשאלה ${n} אפשרויות. פריסת הבחירה משווה עד ${MAX_CHOICE_OPTIONS} דרכים, ולכן נפרסו ` +
    `שלושה קלפים לקריאה כללית של ההתלבטות. כדי להשוות בין הדרכים, צמצמו את השאלה לעד ` +
    `${MAX_CHOICE_OPTIONS} אפשרויות ושלפו שוב.`
  );
}

/**
 * קצב הפריסה וההיפוך לפי מספר הקלפים: פריסות גדולות (12–14 קלפים) נחשפות מהר יותר,
 * כדי שהחשיפה כולה לא תעבור ~13 שניות. undefined = ברירות המחדל של runDeal.
 */
export function dealPace(count: number): { dealMs?: number; flipMs?: number } {
  return count > 10 ? { dealMs: 250, flipMs: 600 } : {};
}

/** תווית העמדה מעל כל קלף, לפי התוכנית (עם fallback מספרי מעבר לאורך התוכנית). */
export function positionLabels(plan: SpreadPlan, count: number): string[] {
  return Array.from({ length: count }, (_, i) => plan.positions[i]?.label ?? `קְלָף ${i + 1}`);
}

// ── הזרקת קונטקסט לפירוש ה-AI: מחלצים מהתוכן הסטטי שכבר בעמוד ──

export interface TarotAiCardContext {
  name: string;
  summary: string;
  text: string;
}

/** מרכיב את קונטקסט הקלפים להזרקה — בסדר השליפה, HTML → טקסט נקי. */
export function buildAiContext(views: CardView[]): TarotAiCardContext[] {
  return views.map((v) => ({
    name: v.name,
    summary: v.summary,
    text: htmlToPlainText(v.interpretationHtml),
  }));
}

// ── שאלת המשך: קלף מבהיר אחד לכל שאלה, נקרא מול הקריאה הקיימת ──

/** תור אחד של שאלת המשך שכבר נענה. */
export interface FollowUpTurn {
  question: string;
  card: CardView;
  /** התשובה (markdown). */
  answer: string;
}

/** שאלה שנשלחה והקלף שנשלף לה — לפני שהתקבלה תשובה (או כשהבקשה נכשלה). */
export interface FollowUpDraft {
  question: string;
  card: CardView;
}

/** מזהי כל הקלפים שכבר על השולחן — הפריסה + קלפי שאלות ההמשך שנענו. */
export function usedCardIds(reading: TarotReading, turns: FollowUpTurn[]): string[] {
  return [...reading.cards.map((c) => c.card.id), ...turns.map((t) => t.card.id)];
}

/** שולף את הקלף המבהיר — ממה שנשאר בחפיסה — וממזג אותו ל-CardView. */
export function drawFollowUpCard(
  reading: TarotReading,
  turns: FollowUpTurn[],
  content: TarotContent,
  rng?: Rng,
): CardView {
  const [drawn] = drawMore(usedCardIds(reading, turns), 1, rng);
  return toCardView(drawn.card, content);
}

/** הקלט של tarot.followUp — כל ההקשר נשלח מהדפדפן בכל בקשה; השרת אינו שומר דבר. */
export interface FollowUpInput {
  readingToken: string;
  question: string;
  cards: TarotAiCardContext[];
  spread: SpreadChoice;
  interpretation: string;
  previous: { question: string; card: TarotAiCardContext; answer: string }[];
  followUp: { question: string; card: TarotAiCardContext };
}

export function buildFollowUpInput(args: {
  token: string;
  question: string;
  views: CardView[];
  spread: SpreadChoice;
  interpretation: string;
  turns: FollowUpTurn[];
  current: FollowUpDraft;
}): FollowUpInput {
  const one = (view: CardView) => buildAiContext([view])[0];
  return {
    readingToken: args.token,
    question: args.question,
    cards: buildAiContext(args.views),
    spread: args.spread,
    interpretation: args.interpretation,
    previous: args.turns.map((t) => ({ question: t.question, card: one(t.card), answer: t.answer })),
    followUp: { question: args.current.question.trim(), card: one(args.current.card) },
  };
}

/** שאלות מוצעות שעוד לא נשאלו בקריאה הזו (השוואה בלי רווחים בקצוות). */
export function unusedSuggestions(suggestions: string[], turns: FollowUpTurn[]): string[] {
  const asked = new Set(turns.map((t) => t.question.trim()));
  return suggestions.filter((s) => !asked.has(s.trim()));
}

/** הקישור לדף הקלף (/tarot/card/<slug>), או null למזהה לא מוכר. */
export function cardPagePath(cardId: string): string | null {
  const struct = cardById(cardId);
  return struct ? `/tarot/card/${cardSlug(struct)}` : null;
}

/** placeholder כשתמונת הקלף עוד לא הועלתה: שם + סמל לפי הקבוצה. */
export function cardFallbackGlyph(cardId: string): string {
  const struct = cardById(cardId);
  if (!struct || struct.arcana === "major") return "✶";
  return { wands: "🜂", cups: "🜄", swords: "🜁", pents: "🜃" }[struct.suit!];
}

// ── דף קלף בודד (/tarot/card/<slug>) + alt מלא לתמונות ──

/** alt עשיר לתמונת קלף — שם + שם אנגלי + מקור החפיסה (SEO תמונות). */
export function cardAltText(struct: CardStruct, name?: string): string {
  return `קלף ${name?.trim() || struct.he} (${struct.en}) — חפיסת הטארוט של רוח חכמה`;
}

export interface CardPageView {
  view: CardView;
  struct: CardStruct;
  slug: string;
  alt: string;
  prev: { slug: string; name: string };
  next: { slug: string; name: string };
}

/**
 * ה-view המלא של דף קלף: מיזוג מבנה+טקסט לפי slug, עם שכן קודם/הבא
 * (מעגלי, בסדר החפיסה הקבוע). null ל-slug לא מוכר → 404.
 */
export function cardPageView(content: TarotContent, slug: string): CardPageView | null {
  const struct = cardBySlug(slug);
  if (!struct) return null;
  const row = findCardText(content.cards, struct.id);
  const name = effectiveCardName(struct, row);
  const idx = CARDS.findIndex((c) => c.id === struct.id);
  const neighbor = (offset: number) => {
    const s = CARDS[(idx + offset + CARDS.length) % CARDS.length];
    return { slug: cardSlug(s), name: effectiveCardName(s, findCardText(content.cards, s.id)) };
  };
  return {
    struct,
    slug,
    alt: cardAltText(struct, name),
    prev: neighbor(-1),
    next: neighbor(1),
    view: {
      id: struct.id,
      name,
      en: struct.en,
      summary: row?.summary ?? "",
      interpretationHtml: row?.interpretation ?? "",
      imageUrl: cardImagePath(struct.id),
      suitLabel: suitLabel(struct),
    },
  };
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
