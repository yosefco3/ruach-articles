import { describe, expect, it } from "vitest";
import { CARDS } from "../shared/tarot";
import { loadSeed, validateSeed } from "./seed-tarot";

describe("tarot seed data", () => {
  it("covers exactly the 78 shared card ids with non-empty summaries", () => {
    const data = loadSeed();
    expect(data.cards).toHaveLength(CARDS.length);
    expect(() => validateSeed(data)).not.toThrow();
    for (const c of data.cards) {
      expect(c.summary.trim().length).toBeGreaterThan(0);
      expect(c.summary.length).toBeLessThanOrEqual(512);
    }
  });

  it("every card carries a full interpretation in RTE-compatible HTML", () => {
    const data = loadSeed();
    for (const c of data.cards) {
      const html = c.interpretationHtml ?? "";
      expect(html.length, c.id).toBeGreaterThanOrEqual(500);
      expect(html.length, c.id).toBeLessThanOrEqual(4000);
      expect(html, c.id).toMatch(/^<p>/);
      expect(html, c.id).toContain("כשהקלף עולה בקריאה");
      // תגי whitelist בלבד (p/strong) — תואם ל-RTE
      const tags = [...html.matchAll(/<\/?([a-z0-9]+)/g)].map((m) => m[1]);
      for (const t of new Set(tags)) expect(["p", "strong"], c.id).toContain(t);
    }
  });

  it("carries a complete intro", () => {
    const { intro } = loadSeed();
    expect(intro.articleHtml).toContain("<p>");
    expect(intro.articleHtml).toContain("אינה הגדת עתידות");
    expect(intro.questionPrompt.length).toBeGreaterThan(0);
    expect(intro.questionHint).toContain("אינה נשמרת");
    expect(intro.buttonLabel.length).toBeGreaterThan(0);
  });

  it("validateSeed rejects missing / foreign / empty entries", () => {
    const good = loadSeed();
    expect(() => validateSeed({ ...good, cards: good.cards.slice(1) })).toThrow(/missing/);
    expect(() =>
      validateSeed({ ...good, cards: [...good.cards.slice(1), { id: "major-99", summary: "x" }] }),
    ).toThrow(/foreign|missing/);
    const emptied = good.cards.map((c, i) => (i === 0 ? { ...c, summary: "  " } : c));
    expect(() => validateSeed({ ...good, cards: emptied })).toThrow(/empty summary/);
  });
});
