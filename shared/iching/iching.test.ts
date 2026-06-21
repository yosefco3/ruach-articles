import { describe, expect, it } from "vitest";
import {
  TRIGRAMS,
  relationFor,
  HEX_NAMES,
  HEX_LOOKUP,
  glyphFor,
  hexagramByTrigrams,
  hexagramByNumber,
  HEXAGRAMS,
} from "./index";

describe("trigrams", () => {
  it("has 8 trigrams indexed by value", () => {
    expect(TRIGRAMS).toHaveLength(8);
    TRIGRAMS.forEach((t, i) => expect(t.value).toBe(i));
  });

  it("has unique symbols and keys", () => {
    expect(new Set(TRIGRAMS.map((t) => t.symbol)).size).toBe(8);
    expect(new Set(TRIGRAMS.map((t) => t.key)).size).toBe(8);
  });

  it("relationFor matches the prototype phrasing", () => {
    expect(relationFor(7, 5)).toBe("אֵשׁ מֵעַל שָׁמַיִם");
    expect(relationFor(5, 5)).toBe("אֵשׁ כְּפוּלָה");
  });
});

describe("hexagram lookup", () => {
  it("HEX_LOOKUP is a bijection onto 1..64", () => {
    const values = Object.values(HEX_LOOKUP);
    expect(values).toHaveLength(64);
    expect(new Set(values).size).toBe(64);
    for (let n = 1; n <= 64; n++) expect(values).toContain(n);
  });

  it("HEX_NAMES has 65 entries with a blank index 0 and no empty 1..64", () => {
    expect(HEX_NAMES).toHaveLength(65);
    expect(HEX_NAMES[0]).toBe("");
    for (let n = 1; n <= 64; n++) expect(HEX_NAMES[n]).not.toBe("");
  });

  it("spot-checks the King Wen mapping against the prototype", () => {
    expect(hexagramByTrigrams(7, 7)?.number).toBe(1);
    expect(hexagramByTrigrams(0, 0)?.number).toBe(2);
    expect(hexagramByTrigrams(7, 0)?.number).toBe(11);
    expect(hexagramByTrigrams(0, 7)?.number).toBe(12);
    expect(hexagramByTrigrams(5, 5)?.number).toBe(30);
    expect(hexagramByTrigrams(2, 2)?.number).toBe(29);
    expect(hexagramByTrigrams(5, 7)?.number).toBe(13);
    expect(hexagramByTrigrams(7, 5)?.number).toBe(14);
  });

  it("glyphFor returns the unicode hexagram glyph", () => {
    expect(glyphFor(1)).toBe("䷀");
    expect(glyphFor(64)).toBe("䷿");
  });

  it("HEXAGRAMS contains all 64 with round-trip structure", () => {
    expect(HEXAGRAMS).toHaveLength(64);
    HEXAGRAMS.forEach((h) => {
      expect(hexagramByTrigrams(h.lower, h.upper)?.number).toBe(h.number);
      expect(hexagramByNumber(h.number)?.name).toBe(h.name);
    });
  });
});
