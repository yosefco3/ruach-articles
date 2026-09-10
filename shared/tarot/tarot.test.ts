import { describe, expect, it } from "vitest";
import {
  CARDS,
  CARD_BACK_IMAGE,
  SUITS,
  cardById,
  cardImagePath,
} from "./cards";

describe("tarot card structure", () => {
  it("has exactly 78 cards: 22 major + 4 suits × 14", () => {
    expect(CARDS).toHaveLength(78);
    expect(CARDS.filter((c) => c.arcana === "major")).toHaveLength(22);
    for (const suit of Object.keys(SUITS)) {
      expect(CARDS.filter((c) => c.suit === suit)).toHaveLength(14);
    }
  });

  it("has unique, well-formed ids", () => {
    const ids = CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(78);
    const pattern =
      /^(major-\d{2}|(wands|cups|swords|pents)-(0[1-9]|10|page|knight|queen|king))$/;
    for (const id of ids) expect(id).toMatch(pattern);
  });

  it("major arcana numbers are 0..21, consecutive, and match the id", () => {
    const majors = CARDS.filter((c) => c.arcana === "major");
    majors.forEach((c, i) => {
      expect(c.number).toBe(i);
      expect(c.id).toBe(`major-${String(i).padStart(2, "0")}`);
      expect(c.suit).toBeUndefined();
      expect(c.rank).toBeUndefined();
    });
  });

  it("minor arcana cards carry suit+rank and no number", () => {
    for (const c of CARDS.filter((c) => c.arcana === "minor")) {
      expect(c.suit).toBeDefined();
      expect(c.rank).toBeDefined();
      expect(c.number).toBeUndefined();
      expect(c.id).toBe(`${c.suit}-${c.rank}`);
    }
  });

  it("every card has non-empty Hebrew and English names", () => {
    for (const c of CARDS) {
      expect(c.he.length).toBeGreaterThan(0);
      expect(c.en.length).toBeGreaterThan(0);
    }
  });

  it("uses the traditional Hebrew names for the sensitive majors", () => {
    expect(cardById("major-05")?.he).toBe("הכהן הגדול");
    expect(cardById("major-13")?.he).toBe("המוות");
    expect(cardById("major-15")?.he).toBe("השטן");
    expect(cardById("major-20")?.he).toBe("יום הדין");
  });

  it("looks up cards and builds image paths", () => {
    expect(cardById("pents-09")?.he).toBe("תשעה מטבעות");
    expect(cardById("nope")).toBeUndefined();
    expect(cardImagePath("major-00")).toBe("/tarot-cards/major-00.webp?v=6");
    expect(CARD_BACK_IMAGE).toBe("/tarot-cards/back.webp?v=6");
  });
});
