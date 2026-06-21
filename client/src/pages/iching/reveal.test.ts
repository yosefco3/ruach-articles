import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runReveal } from "./reveal";

describe("runReveal (animated)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reveals lines 0→6 in order, then signals done", () => {
    const settled: number[] = [];
    const flips: number[] = [];
    let done = false;
    runReveal(
      {
        onFlipStart: (i) => flips.push(i),
        onSettle: (i) => settled.push(i),
        onDone: () => {
          done = true;
        },
      },
      { flipMs: 750, betweenMs: 1250 },
    );

    // first line flips immediately, settles after flipMs
    expect(flips).toEqual([0]);
    expect(settled).toEqual([]);
    vi.advanceTimersByTime(750);
    expect(settled).toEqual([0]);
    expect(done).toBe(false);

    // run the rest of the sequence
    vi.advanceTimersByTime(6 * (750 + 1250));
    expect(settled).toEqual([0, 1, 2, 3, 4, 5]);
    expect(flips).toEqual([0, 1, 2, 3, 4, 5]);
    expect(done).toBe(true);
  });

  it("cancel() stops the sequence and clears pending timers", () => {
    const settled: number[] = [];
    let done = false;
    const cancel = runReveal(
      {
        onFlipStart: () => {},
        onSettle: (i) => settled.push(i),
        onDone: () => {
          done = true;
        },
      },
      { flipMs: 750, betweenMs: 1250 },
    );
    vi.advanceTimersByTime(750); // settle line 0
    cancel();
    vi.advanceTimersByTime(10_000);
    expect(settled).toEqual([0]);
    expect(done).toBe(false);
  });
});

describe("runReveal (reduced motion)", () => {
  it("reveals all six lines immediately with no timers", () => {
    const settled: number[] = [];
    let done = false;
    // ללא fake timers — אם היה משתמש ב-setTimeout הטסט היה נכשל מיד
    runReveal(
      {
        onFlipStart: () => {},
        onSettle: (i) => settled.push(i),
        onDone: () => {
          done = true;
        },
      },
      { reducedMotion: true },
    );
    expect(settled).toEqual([0, 1, 2, 3, 4, 5]);
    expect(done).toBe(true);
  });
});
