import { describe, expect, it } from "vitest";
import { cast, tossLine } from "./cast";

/** RNG דטרמיניסטי: מחזיר ערכים מהרצף, מתגלגל מחזורית. */
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("tossLine", () => {
  it("rng→0 gives three yang faces (sum 9, changing)", () => {
    const toss = tossLine(seqRng([0]));
    expect(toss.coins).toEqual([3, 3, 3]);
    expect(toss.sum).toBe(9);
  });

  it("rng≥0.5 gives three yin faces (sum 6, changing)", () => {
    const toss = tossLine(seqRng([0.9]));
    expect(toss.coins).toEqual([2, 2, 2]);
    expect(toss.sum).toBe(6);
  });
});

describe("cast", () => {
  it("produces sums in {6,7,8,9} with consistent line flags", () => {
    const reading = cast(seqRng([0, 0, 0.9, 0.9])); // varied
    reading.tosses.forEach((t, i) => {
      expect([6, 7, 8, 9]).toContain(t.sum);
      const line = reading.lines[i];
      expect(line.isYang).toBe(t.sum % 2 === 1);
      expect(line.isChanging).toBe(t.sum === 6 || t.sum === 9);
    });
  });

  it("has no resulting hexagram when there are no changing lines", () => {
    // sum 8 (yin young, stable) for every line: coins 3,3,2 → rng 0,0,0.9
    const reading = cast(seqRng([0, 0, 0.9]));
    expect(reading.changing).toEqual([]);
    expect(reading.resulting).toBeUndefined();
    expect(reading.resultLines).toBeUndefined();
  });

  it("all-six lines → primary 2 (all yin), resulting 1 (all flipped to yang)", () => {
    const reading = cast(seqRng([0.9])); // every coin yin → sum 6 changing
    expect(reading.primary.number).toBe(2);
    expect(reading.changing).toEqual([1, 2, 3, 4, 5, 6]);
    expect(reading.resulting?.number).toBe(1);
  });

  it("a single changing line flips exactly one line in the resulting hexagram", () => {
    // line 1 (bottom): sum 9 changing yang (0,0,0); lines 2-6: sum 8 stable yin (0,0,0.9)
    const reading = cast(
      seqRng([
        0, 0, 0, // line 1: sum 9, changing
        0, 0, 0.9, // line 2: sum 8, stable
        0, 0, 0.9, // line 3
        0, 0, 0.9, // line 4
        0, 0, 0.9, // line 5
        0, 0, 0.9, // line 6
      ]),
    );
    expect(reading.changing).toEqual([1]);
    expect(reading.resulting).toBeDefined();
    expect(reading.resulting!.number).not.toBe(reading.primary.number);
    const diffs = reading.lines.filter(
      (l, i) => l.isYang !== reading.resultLines![i].isYang,
    );
    expect(diffs).toHaveLength(1);
  });

  it("matches the prototype trigram values (all-yang=7, all-yin=0)", () => {
    const allYang = cast(seqRng([0])); // sum 9 every line
    expect(allYang.primary.lower).toBe(7);
    expect(allYang.primary.upper).toBe(7);
    const allYin = cast(seqRng([0.9]));
    expect(allYin.primary.lower).toBe(0);
    expect(allYin.primary.upper).toBe(0);
  });
});
