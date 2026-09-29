import { describe, expect, it } from "vitest";
import { CARDS } from "./cards";
import { SPREAD_SIZE, draw, drawMore, secureRng } from "./draw";

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

  it("secureRng yields uniform-ish values in [0,1) from the crypto source", () => {
    const n = 10_000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const v = secureRng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    // ממוצע של 10k דגימות אחידות ~0.5 (סטיית תקן ~0.003 → גבולות רחבים פי כמה)
    expect(sum / n).toBeGreaterThan(0.45);
    expect(sum / n).toBeLessThan(0.55);
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

describe("drawMore — drawing from the remaining deck", () => {
  it("never returns an excluded card", () => {
    for (let i = 0; i < 500; i++) {
      const reading = draw(3);
      const exclude = reading.cards.map((c) => c.card.id);
      const [extra] = drawMore(exclude);
      expect(exclude).not.toContain(extra.card.id);
    }
  });

  it("returns exactly the last card when 77 are excluded", () => {
    const last = CARDS[CARDS.length - 1];
    const exclude = CARDS.slice(0, -1).map((c) => c.id);
    const drawn = drawMore(exclude);
    expect(drawn).toHaveLength(1);
    expect(drawn[0].card.id).toBe(last.id);
  });

  it("is deterministic for a fixed rng and continues the position numbering", () => {
    const exclude = CARDS.slice(0, 3).map((c) => c.id);
    const values = [0.12, 0.87, 0.42, 0.63, 0.05, 0.99, 0.31];
    const a = drawMore(exclude, 2, seqRng(values));
    const b = drawMore(exclude, 2, seqRng(values));
    expect(a.map((c) => c.card.id)).toEqual(b.map((c) => c.card.id));
    expect(a.map((c) => c.position)).toEqual([3, 4]);
    expect(a.every((c) => c.orientation === "upright")).toBe(true);
  });

  it("honours an explicit start position", () => {
    const [extra] = drawMore(["nope"], 1, () => 0.5, 7);
    expect(extra.position).toBe(7);
  });

  it("ignores unknown ids in the exclusion list", () => {
    const drawn = drawMore(["not-a-card", "also-not"], CARDS.length);
    expect(new Set(drawn.map((c) => c.card.id)).size).toBe(CARDS.length);
  });

  it("draws several unique cards at once", () => {
    const exclude = CARDS.slice(0, 10).map((c) => c.id);
    const drawn = drawMore(exclude, 5);
    const ids = drawn.map((c) => c.card.id);
    expect(new Set(ids).size).toBe(5);
    ids.forEach((id) => expect(exclude).not.toContain(id));
  });

  it("throws on an invalid count or when not enough cards remain", () => {
    const exclude = CARDS.slice(0, -1).map((c) => c.id);
    expect(() => drawMore(exclude, 2)).toThrow();
    expect(() => drawMore([], 0)).toThrow();
    expect(() => drawMore([], 1.5)).toThrow();
    expect(() => drawMore(CARDS.map((c) => c.id), 1)).toThrow();
  });
});
