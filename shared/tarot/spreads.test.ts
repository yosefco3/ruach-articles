import { describe, expect, it } from "vitest";
import {
  MAX_OPTION_LENGTH,
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

  it("choice: now + 2 per option + hidden, so 2/3/4 options → 6/8/10 cards", () => {
    for (const n of [2, 3, 4]) {
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
    ["five options", { kind: "choice", options: ["א", "ב", "ג", "ד", "ה"] }],
    ["empty strings only", { kind: "choice", options: ["", "   "] }],
    ["non-strings", { kind: "choice", options: [1, 2] }],
  ])("falls back to three for %s", (_label, raw) => {
    expect(normalizeSpreadChoice(raw)).toEqual(THREE_SPREAD);
  });

  it("drops empty/non-string entries but keeps the rest when still 2–4", () => {
    expect(normalizeSpreadChoice({ kind: "choice", options: ["א", "", 3, "ב"] }).options).toEqual(["א", "ב"]);
  });

  it("truncates over-long wording", () => {
    const long = "א".repeat(MAX_OPTION_LENGTH + 20);
    const res = normalizeSpreadChoice({ kind: "choice", options: [long, "ב"] });
    expect(res.options[0]).toHaveLength(MAX_OPTION_LENGTH);
  });
});

describe("optionLetter", () => {
  it("maps 0..3 to Hebrew letters and falls back to numbers", () => {
    expect([0, 1, 2, 3].map(optionLetter)).toEqual(["א׳", "ב׳", "ג׳", "ד׳"]);
    expect(optionLetter(4)).toBe("5");
  });
});
