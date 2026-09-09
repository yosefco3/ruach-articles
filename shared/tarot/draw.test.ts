import { describe, expect, it } from "vitest";
import { CARDS } from "./cards";
import { SPREAD_SIZE, draw } from "./draw";

/** RNG דטרמיניסטי מסדרת ערכים קבועה (מוחזר מחזורית). */
function seqRng(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("tarot draw engine", () => {
  it("draws 3 unique upright cards with sequential positions", () => {
    const reading = draw();
    expect(reading.cards).toHaveLength(SPREAD_SIZE);
    expect(new Set(reading.cards.map((c) => c.card.id)).size).toBe(SPREAD_SIZE);
    reading.cards.forEach((c, i) => {
      expect(c.position).toBe(i);
      expect(c.orientation).toBe("upright");
    });
  });

  it("is deterministic for a fixed rng", () => {
    const rngValues = [0.12, 0.87, 0.42, 0.63, 0.05, 0.99, 0.31];
    const a = draw(3, seqRng(rngValues)).cards.map((c) => c.card.id);
    const b = draw(3, seqRng(rngValues)).cards.map((c) => c.card.id);
    expect(a).toEqual(b);
  });

  it("survives extreme rng values without duplicates or range errors", () => {
    for (const v of [0, 0.999999]) {
      const reading = draw(3, () => v);
      const ids = reading.cards.map((c) => c.card.id);
      expect(new Set(ids).size).toBe(3);
    }
  });

  it("never repeats a card within a reading, and covers the deck over many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const reading = draw();
      const ids = reading.cards.map((c) => c.card.id);
      expect(new Set(ids).size).toBe(3);
      ids.forEach((id) => seen.add(id));
    }
    // 3000 שליפות אקראיות — ההסתברות שקלף כלשהו לא הופיע זניחה
    expect(seen.size).toBe(CARDS.length);
  });

  it("rejects invalid counts", () => {
    expect(() => draw(0)).toThrow();
    expect(() => draw(79)).toThrow();
    expect(() => draw(1.5)).toThrow();
  });

  it("can draw the whole deck as a permutation", () => {
    const reading = draw(78);
    expect(new Set(reading.cards.map((c) => c.card.id)).size).toBe(78);
  });
});
