import { describe, expect, it } from "vitest";
import {
  MAX_FOLLOWUPS,
  MAX_FOLLOWUP_LENGTH,
  followUpSuggestions,
  followUpsLeftLabel,
} from "./followup";
import type { SpreadKind } from "./spreads";

describe("tarot follow-up constants", () => {
  it("allows two follow-ups per reading", () => {
    expect(MAX_FOLLOWUPS).toBe(2);
  });
});

describe("followUpsLeftLabel", () => {
  it("uses the plural form for two or more", () => {
    expect(followUpsLeftLabel(2)).toBe("נותרו 2 שאלות המשך");
  });

  it("uses the feminine singular form for one", () => {
    expect(followUpsLeftLabel(1)).toBe("נותרה שאלת המשך אחת");
  });

  it("is empty when nothing is left or the value is invalid", () => {
    expect(followUpsLeftLabel(0)).toBe("");
    expect(followUpsLeftLabel(-1)).toBe("");
    expect(followUpsLeftLabel(Number.NaN)).toBe("");
  });
});

describe("followUpSuggestions", () => {
  const kinds: SpreadKind[] = ["three", "choice"];

  it.each(kinds)("offers 4 unique, valid questions for the %s spread", (kind) => {
    const list = followUpSuggestions(kind);
    expect(list).toHaveLength(4);
    expect(new Set(list).size).toBe(4);
    for (const q of list) {
      expect(q.trim()).toBe(q);
      expect(q.length).toBeGreaterThan(0);
      expect(q.length).toBeLessThanOrEqual(MAX_FOLLOWUP_LENGTH);
      expect(q.endsWith("?")).toBe(true);
    }
  });

  it("differs between the spreads", () => {
    expect(followUpSuggestions("three")).not.toEqual(followUpSuggestions("choice"));
  });

  it("returns a copy — mutating it does not affect later calls", () => {
    const list = followUpSuggestions("three");
    list.pop();
    expect(followUpSuggestions("three")).toHaveLength(4);
  });

  it("never suggests a date-style timing question", () => {
    for (const kind of kinds) {
      for (const q of followUpSuggestions(kind)) {
        // "מתי" כמילה שלמה בלבד — "להמתין" מכילה את הרצף ואינה שאלת זמן.
        expect(q).not.toMatch(/(^|\s)מתי(\s|\?|$)|תוך כמה|כמה זמן/);
      }
    }
  });
});
