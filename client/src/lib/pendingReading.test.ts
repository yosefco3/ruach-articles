/** בדיקות לשימור פריסה סביב התחברות — sessionStorage מדומה (הטסטים רצים ב-node). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cast } from "@shared/iching";
import { draw } from "@shared/tarot";
import {
  savePendingIching,
  savePendingTarot,
  takePendingIching,
  takePendingTarot,
} from "./pendingReading";

function fakeSessionStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

beforeEach(() => {
  vi.stubGlobal("sessionStorage", fakeSessionStorage());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("pending tarot reading", () => {
  it("שמירה ושחזור: אותם קלפים באותו סדר, והמפתח נמחק אחרי הקריאה", () => {
    const reading = draw();
    savePendingTarot("מה צפוי לי?", reading);
    const restored = takePendingTarot();
    expect(restored?.q).toBe("מה צפוי לי?");
    expect(restored?.reading.cards.map((c) => c.card.id)).toEqual(
      reading.cards.map((c) => c.card.id),
    );
    expect(restored?.spread).toEqual({ kind: "three", options: [] }); // ברירת מחדל
    expect(takePendingTarot()).toBeNull(); // חד-פעמי
  });

  it("פריסת בחירה: 6 קלפים + התוכנית משוחזרים יחד", () => {
    const reading = draw(6);
    const spread = { kind: "choice" as const, options: ["לעבור", "להישאר"] };
    savePendingTarot("לעבור או להישאר?", reading, spread);
    const restored = takePendingTarot();
    expect(restored?.reading.cards).toHaveLength(6);
    expect(restored?.spread).toEqual(spread);
  });

  it("payload ישן (מערך מזהים בלבד) → משוחזר כפריסת שלושה קלפים", () => {
    const ids = draw().cards.map((c) => c.card.id);
    sessionStorage.setItem("tarot:pending-reading", JSON.stringify({ q: "ש", ts: Date.now(), payload: ids }));
    const restored = takePendingTarot();
    expect(restored?.reading.cards.map((c) => c.card.id)).toEqual(ids);
    expect(restored?.spread).toEqual({ kind: "three", options: [] });
  });

  it("תוכנית פגומה בפריסה שמורה → נופל ל-three (לא null)", () => {
    const ids = draw().cards.map((c) => c.card.id);
    sessionStorage.setItem(
      "tarot:pending-reading",
      JSON.stringify({ q: "ש", ts: Date.now(), payload: { ids, spread: { kind: "choice", options: ["אחת"] } } }),
    );
    expect(takePendingTarot()?.spread.kind).toBe("three");
  });

  it("מזהה קלף לא מוכר → null", () => {
    sessionStorage.setItem(
      "tarot:pending-reading",
      JSON.stringify({ q: "", ts: Date.now(), payload: { ids: ["no-such-card", "x", "y"], spread: null } }),
    );
    expect(takePendingTarot()).toBeNull();
  });

  it("פג תוקף אחרי 30 דקות → null", () => {
    vi.useFakeTimers();
    savePendingTarot("שאלה", draw());
    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(takePendingTarot()).toBeNull();
  });

  it("ללא sessionStorage (חסום) — לא נזרקת שגיאה", () => {
    vi.stubGlobal("sessionStorage", undefined);
    expect(() => savePendingTarot("", draw())).not.toThrow();
    expect(takePendingTarot()).toBeNull();
  });
});

describe("pending iching reading", () => {
  it("שמירה ושחזור של קריאה מלאה (כולל קווים משתנים אם נפלו)", () => {
    const reading = cast();
    savePendingIching("האם לצאת לדרך?", reading);
    const restored = takePendingIching();
    expect(restored?.q).toBe("האם לצאת לדרך?");
    expect(restored?.reading).toEqual(reading);
    expect(takePendingIching()).toBeNull(); // חד-פעמי
  });

  it("קריאה קטומה/פגומה → null", () => {
    sessionStorage.setItem(
      "iching:pending-reading",
      JSON.stringify({ q: "", ts: Date.now(), payload: { lines: [] } }),
    );
    expect(takePendingIching()).toBeNull();
  });
});
