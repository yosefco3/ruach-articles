/**
 * מנוע השליפה — דגימה ללא החזרה מחפיסה אחת (בניגוד ל-6 הטלות בלתי-תלויות
 * של האי-צ'ינג): Fisher–Yates מלא על עותק, ואז שליפת הראשונים.
 * פונקציה טהורה עם RNG מוזרק לבדיקות. האנימציה רק *חושפת* תוצאה שחושבה כאן.
 * orientation שמור לעתיד (קלפים הפוכים) — שלב א' תמיד "upright".
 */
import { CARDS, type CardStruct } from "./cards";

export type Rng = () => number; // [0,1) — ברירת מחדל Math.random

export type Orientation = "upright" | "reversed";

export interface DrawnCard {
  card: CardStruct;
  position: number; // 0-based, סדר השליפה
  orientation: Orientation;
}

export interface TarotReading {
  cards: DrawnCard[];
}

export const SPREAD_SIZE = 3;

export function draw(count: number = SPREAD_SIZE, rng: Rng = Math.random): TarotReading {
  if (!Number.isInteger(count) || count < 1 || count > CARDS.length) {
    throw new Error(`invalid draw count: ${count}`);
  }
  const deck = [...CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return {
    cards: deck.slice(0, count).map((card, position) => ({
      card,
      position,
      orientation: "upright" as const,
    })),
  };
}
