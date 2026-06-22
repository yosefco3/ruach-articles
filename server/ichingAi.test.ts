import { describe, expect, it } from "vitest";
import { buildIchingPrompt } from "./ichingAi";

describe("buildIchingPrompt (pure)", () => {
  const base = {
    question: "האם כדאי לי להחליף עבודה?",
    baseName: "הקסגרמה 1 — היצירה",
    baseText: "כוח יוצר טהור, יוזמה.",
  };

  it("opens with the Tao Oracle persona sentence", () => {
    const prompt = buildIchingPrompt(base);
    expect(prompt.startsWith("אתה מומחה לאי צ'ינג בגישת מא דווה פדמה")).toBe(true);
  });

  it("includes the question and base hexagram name + text", () => {
    const prompt = buildIchingPrompt(base);
    expect(prompt).toContain(base.question);
    expect(prompt).toContain(base.baseName);
    expect(prompt).toContain(base.baseText);
  });

  it("includes the result hexagram when present", () => {
    const prompt = buildIchingPrompt({
      ...base,
      resultName: "הקסגרמה 2 — הקבלה",
      resultText: "התמסרות, היענות.",
    });
    expect(prompt).toContain("הקסגרמה 2 — הקבלה");
    expect(prompt).toContain("התמסרות, היענות.");
  });

  it("marks a stable reading when there is no result hexagram", () => {
    const prompt = buildIchingPrompt(base);
    expect(prompt).toContain("קריאה יציבה ללא קווים משתנים");
  });

  it("treats a blank resultName as no result", () => {
    const prompt = buildIchingPrompt({ ...base, resultName: "   " });
    expect(prompt).toContain("קריאה יציבה ללא קווים משתנים");
  });
});
