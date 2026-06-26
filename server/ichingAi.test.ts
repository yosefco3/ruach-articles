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

  it("injects only the changing lines that were passed, numbered from the bottom", () => {
    const prompt = buildIchingPrompt({
      ...base,
      changingLines: [
        { line: 2, text: "פתיחות לשינוי" },
        { line: 5, text: "הנהגה ברורה" },
      ],
    });
    expect(prompt).toContain("קו 1 = הקו התחתון");
    expect(prompt).toContain("- קו 2: פתיחות לשינוי");
    expect(prompt).toContain("- קו 5: הנהגה ברורה");
    expect(prompt).toContain("שלב את משמעות הקווים המשתנים בניתוח");
  });

  it("omits the changing-lines block entirely when none are passed", () => {
    expect(buildIchingPrompt(base)).not.toContain("הקווים המשתנים בקריאה זו");
    expect(buildIchingPrompt({ ...base, changingLines: [] })).not.toContain("קו 1 = הקו התחתון");
  });

  it("asks for a verdict line that classifies the omen as yes / no / mixed", () => {
    const prompt = buildIchingPrompt(base);
    expect(prompt).toContain("שורת הכרעה");
    expect(prompt).toContain("**כן**");
    expect(prompt).toContain("**לא, ככל הנראה**");
    expect(prompt).toContain("מעורב");
  });

  it("bases the verdict on the result hexagram when the reading transforms", () => {
    const prompt = buildIchingPrompt({
      ...base,
      resultName: "הקסגרמה 2 — הקבלה",
      resultText: "התמסרות, היענות.",
    });
    expect(prompt).toContain("הקסגרמת התוצאה");
  });

  it("bases the verdict on the base hexagram for a stable reading", () => {
    expect(buildIchingPrompt(base)).toContain("בסס את ההכרעה בעיקר על הקסגרמת הבסיס");
  });

  it("tells the model not to parrot the source vocabulary", () => {
    expect(buildIchingPrompt(base)).toContain("אל תצטט אותם");
  });
});
