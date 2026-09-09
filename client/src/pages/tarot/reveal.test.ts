import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runDeal, type DealCallbacks } from "./reveal";

function spyCallbacks() {
  const events: string[] = [];
  const cb: DealCallbacks = {
    onShuffleStart: () => events.push("shuffle"),
    onDeal: (i) => events.push(`deal${i}`),
    onFlip: (i) => events.push(`flip${i}`),
    onDone: () => events.push("done"),
  };
  return { events, cb };
}

describe("runDeal", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires shuffle → deal×3 → flip×3 → done, in order and on schedule", () => {
    const { events, cb } = spyCallbacks();
    runDeal(cb, { shuffleMs: 1000, dealMs: 300, flipMs: 800 });
    expect(events).toEqual(["shuffle"]); // מיידי

    vi.advanceTimersByTime(1000);
    expect(events).toContain("deal0");
    vi.advanceTimersByTime(300 + 300);
    expect(events).toEqual(["shuffle", "deal0", "deal1", "deal2"]);

    vi.advanceTimersByTime(300 + 250); // מרווח הפריסה האחרון + הנשימה לפני ההיפוך הראשון
    expect(events).toContain("flip0");
    vi.advanceTimersByTime(800 * 2);
    expect(events.slice(-2)).toEqual(["flip1", "flip2"]);
    vi.advanceTimersByTime(800);
    expect(events.at(-1)).toBe("done");
  });

  it("reducedMotion reveals everything synchronously", () => {
    const { events, cb } = spyCallbacks();
    runDeal(cb, { reducedMotion: true });
    expect(events).toEqual(["deal0", "deal1", "deal2", "flip0", "flip1", "flip2", "done"]);
  });

  it("cancel stops all pending callbacks", () => {
    const { events, cb } = spyCallbacks();
    const cancel = runDeal(cb, { shuffleMs: 1000, dealMs: 300, flipMs: 800 });
    vi.advanceTimersByTime(1000); // deal0 נורה
    cancel();
    vi.advanceTimersByTime(60_000);
    expect(events.filter((e) => e.startsWith("flip"))).toHaveLength(0);
    expect(events).not.toContain("done");
  });
});
