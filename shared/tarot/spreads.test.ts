import { describe, expect, it } from "vitest";
import {
  MAX_OPTION_LENGTH,
  MAX_TITLE_LENGTH,
  sanitizeReadingTitle,
  THREE_SPREAD,
  normalizeSpreadChoice,
  optionLetter,
  spreadPlan,
  spreadSize,
} from "./spreads";

describe("spreadPlan", () => {
  it("three: 3 positions, the second is the center", () => {
    const plan = spreadPlan(THREE_SPREAD);
    expect(plan.kind).toBe("three");
    expect(plan.positions).toHaveLength(3);
    expect(plan.positions[1].key).toBe("center");
    expect(plan.positions.map((p) => p.label)).toEqual(["קְלָף רִאשׁוֹן", "קְלָף שֵׁנִי", "קְלָף שְׁלִישִׁי"]);
    expect(plan.positions.every((p) => p.option === undefined)).toBe(true);
  });

  it("choice: now + 2 per option + hidden, so 2…6 options → 6/8/10/12/14 cards", () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const options = Array.from({ length: n }, (_, i) => `אפשרות ${i}`);
      const plan = spreadPlan({ kind: "choice", options });
      expect(plan.positions).toHaveLength(2 + 2 * n);
      expect(spreadSize({ kind: "choice", options })).toBe(2 + 2 * n);
      expect(plan.positions[0].key).toBe("now");
      expect(plan.positions.at(-1)!.key).toBe("hidden");
      expect(new Set(plan.positions.map((p) => p.key)).size).toBe(plan.positions.length);
    }
  });

  it("choice: option positions carry the option index and its wording, same two roles per option", () => {
    const plan = spreadPlan({ kind: "choice", options: ["לעבור דירה", "להישאר"] });
    const opt0 = plan.positions.filter((p) => p.option === 0);
    const opt1 = plan.positions.filter((p) => p.option === 1);
    expect(opt0.map((p) => p.label)).toEqual(["מָה מַצִּיעָה", "לְאָן מוֹבִילָה"]);
    expect(opt1.map((p) => p.label)).toEqual(["מָה מַצִּיעָה", "לְאָן מוֹבִילָה"]);
    expect(opt0[0].role).toContain("לעבור דירה");
    expect(opt1[0].role).toContain("להישאר");
    expect(opt0[0].role).toContain("דרך א׳");
    expect(opt1[0].role).toContain("דרך ב׳");
    expect(plan.title).toBe("פְּרִיסַת שְׁתֵּי הַדְּרָכִים");
    expect(spreadPlan({ kind: "choice", options: ["א", "ב", "ג"] }).title).toBe("פְּרִיסַת הַמְּנִיפָה");
  });
});

describe("normalizeSpreadChoice (fail-open)", () => {
  it("keeps a valid choice, trimming the wording", () => {
    expect(normalizeSpreadChoice({ kind: "choice", options: ["  לעבור ", "להישאר"] })).toEqual({
      kind: "choice",
      options: ["לעבור", "להישאר"],
    });
  });

  it.each([
    ["null", null],
    ["string", "choice"],
    ["unknown kind", { kind: "celtic", options: ["א", "ב"] }],
    ["three", { kind: "three", options: ["א", "ב"] }],
    ["missing options", { kind: "choice" }],
    ["one option", { kind: "choice", options: ["א"] }],
    ["empty strings only", { kind: "choice", options: ["", "   "] }],
    ["non-strings", { kind: "choice", options: [1, 2] }],
  ])("falls back to three for %s", (_label, raw) => {
    expect(normalizeSpreadChoice(raw)).toEqual(THREE_SPREAD);
  });

  it("accepts five and six options (two cards each)", () => {
    const five = ["5", "10", "25", "50", "100"];
    expect(normalizeSpreadChoice({ kind: "choice", options: five })).toEqual({ kind: "choice", options: five });
    const six = [...five, "200"];
    expect(normalizeSpreadChoice({ kind: "choice", options: six }).options).toHaveLength(6);
    expect(spreadPlan({ kind: "choice", options: six }).title).toBe("פְּרִיסַת הַמְּנִיפָה");
  });

  it("the fifth and sixth roads get their own Hebrew letters", () => {
    const plan = spreadPlan({ kind: "choice", options: ["א", "ב", "ג", "ד", "ה", "ו"] });
    expect(plan.positions.filter((p) => p.option === 4)[0].role).toContain("דרך ה׳");
    expect(plan.positions.filter((p) => p.option === 5)[0].role).toContain("דרך ו׳");
  });

  it("more than six options → three cards, reporting how many options were found", () => {
    const seven = ["1", "2", "3", "4", "5", "6", "7"];
    expect(normalizeSpreadChoice({ kind: "choice", options: seven })).toEqual({
      kind: "three",
      options: [],
      overflow: 7,
    });
    expect(normalizeSpreadChoice({ kind: "choice", options: seven, title: "בחירת חשבון" })).toEqual({
      kind: "three",
      options: [],
      title: "בחירת חשבון",
      overflow: 7,
    });
    const many = Array.from({ length: 40 }, (_, i) => String(i));
    expect(normalizeSpreadChoice({ kind: "choice", options: many }).overflow).toBe(12);
    expect(spreadSize(normalizeSpreadChoice({ kind: "choice", options: seven }))).toBe(3);
  });

  it("keeps the overflow notice when an already-normalized choice is normalized again", () => {
    const once = normalizeSpreadChoice({ kind: "choice", options: ["1", "2", "3", "4", "5", "6", "7"] });
    expect(normalizeSpreadChoice(once)).toEqual(once);
    // ערך לא הגיוני אינו מתקבל
    expect(normalizeSpreadChoice({ kind: "three", options: [], overflow: 3 })).toEqual(THREE_SPREAD);
    expect(normalizeSpreadChoice({ kind: "three", options: [], overflow: "7" })).toEqual(THREE_SPREAD);
  });

  it("no overflow notice for an ordinary three-card reading", () => {
    expect(normalizeSpreadChoice({ kind: "three", options: [] }).overflow).toBeUndefined();
    expect(normalizeSpreadChoice({ kind: "choice", options: ["א"] }).overflow).toBeUndefined();
  });

  it("drops empty/non-string entries but keeps the rest when still 2–6", () => {
    expect(normalizeSpreadChoice({ kind: "choice", options: ["א", "", 3, "ב"] }).options).toEqual(["א", "ב"]);
  });

  it("truncates over-long wording", () => {
    const long = "א".repeat(MAX_OPTION_LENGTH + 20);
    const res = normalizeSpreadChoice({ kind: "choice", options: [long, "ב"] });
    expect(res.options[0]).toHaveLength(MAX_OPTION_LENGTH);
  });
});

describe("optionLetter", () => {
  it("maps 0..5 to Hebrew letters and falls back to numbers", () => {
    expect([0, 1, 2, 3, 4, 5].map(optionLetter)).toEqual(["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"]);
    expect(optionLetter(6)).toBe("7");
  });
});

describe("reading title (file name)", () => {
  it("keeps a sanitized title on both kinds, and omits it when absent/junk", () => {
    expect(normalizeSpreadChoice({ kind: "choice", options: ["א", "ב"], title: " קטלבל: הרד או ספורט " })).toEqual({
      kind: "choice",
      options: ["א", "ב"],
      title: "קטלבל הרד או ספורט",
    });
    expect(normalizeSpreadChoice({ kind: "three", options: [], title: "מעבר דירה" })).toEqual({
      kind: "three",
      options: [],
      title: "מעבר דירה",
    });
    expect(normalizeSpreadChoice({ kind: "three", options: [], title: "?" })).toEqual(THREE_SPREAD);
    expect(normalizeSpreadChoice({ kind: "choice", options: ["א", "ב"], title: 42 })).toEqual({ kind: "choice", options: ["א", "ב"] });
  });

  it("sanitizeReadingTitle strips file-name-hostile characters and caps the length", () => {
    expect(sanitizeReadingTitle('a/b\\c:d*e?f"g<h>i|j\nk')).toBe("a b c d e f g h i j k");
    expect(sanitizeReadingTitle("x".repeat(MAX_TITLE_LENGTH + 30))).toHaveLength(MAX_TITLE_LENGTH);
    expect(sanitizeReadingTitle("")).toBeUndefined();
    expect(sanitizeReadingTitle(null)).toBeUndefined();
  });
});
