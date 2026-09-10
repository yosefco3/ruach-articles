import { describe, expect, it, vi } from "vitest";
import { buildTarotPrompt, type TarotAiContext } from "./tarotAi";

const cards = [
  { name: "השוטה", summary: "התחלה חדשה", text: "פירוש השוטה המלא" },
  { name: "המגדל", summary: "טלטלה משחררת", text: "פירוש המגדל המלא" },
  { name: "הכוכב", summary: "תקווה", text: "פירוש הכוכב המלא" },
];

describe("buildTarotPrompt (pure)", () => {
  it("injects the question, all three names and all three texts in draw order", () => {
    const p = buildTarotPrompt({ question: "מה נכון להבין במעבר הדירה?", cards });
    expect(p).toContain('שאלת המשתמש: "מה נכון להבין במעבר הדירה?"');
    for (const c of cards) {
      expect(p).toContain(c.name);
      expect(p).toContain(c.text);
    }
    expect(p.indexOf("השוטה")).toBeLessThan(p.indexOf("המגדל"));
    expect(p.indexOf("המגדל")).toBeLessThan(p.indexOf("הכוכב"));
    expect(p).toContain("קלף 1 (מסייע");
    expect(p).toContain("קלף 3 (מסייע");
  });

  it("an empty question becomes a general-reading line, not an empty quote", () => {
    const p = buildTarotPrompt({ question: "   ", cards });
    expect(p).toContain("קריאה כללית");
    expect(p).not.toContain('""');
  });

  it("fixes the center-card method: card 2 carries the answer, sides assist", () => {
    const p = buildTarotPrompt({ question: "ש", cards });
    expect(p).toContain("קלף 2 (הקלף המרכזי — נושא התשובה)");
    expect(p).toContain("שיטת הקריאה — קלף מרכזי ושני מסייעים");
    expect(p).toContain("תומך ומתנגד");
    expect(p).toContain("סדר עבודה פנימי");
    // אין תפקידי עבר/הווה/עתיד — השיטה היא מרכזי+מסייעים
    expect(p).not.toContain("קלף העבר");
    expect(p).not.toContain("קלף ההווה");
    expect(p).not.toContain("קלף העתיד");
  });

  it("carries the output contract and the guardrails", () => {
    const p = buildTarotPrompt({ question: "ש", cards });
    expect(p).toContain("שורת מהות");
    expect(p).toContain("דרך פעולה");
    expect(p).toContain("אל תצטט");
    expect(p).toContain("אל תבטיח/י ודאות");
    expect(p).toContain("בעברית");
    expect(p).toContain("Markdown");
  });

  it("omits empty summary/text parts instead of leaving dangling dashes", () => {
    const bare: TarotAiContext = {
      question: "ש",
      cards: [{ name: "השוטה", summary: "", text: "" }, cards[1], cards[2]],
    };
    const p = buildTarotPrompt(bare);
    expect(p).toContain('"השוטה"');
    expect(p).not.toContain("השוטה — "); // אין מקף תלוי אחרי שם בלי טקסט
  });
});

describe("generateTarotInterpretation", () => {
  it("delegates to generateText with the built prompt and maxTokens 3000", async () => {
    vi.resetModules();
    const generateText = vi.fn().mockResolvedValue("תשובה");
    vi.doMock("./_core/aiProvider", () => ({ generateText }));
    const { generateTarotInterpretation } = await import("./tarotAi");

    const ctx: TarotAiContext = { question: "ש", cards };
    await expect(generateTarotInterpretation(ctx)).resolves.toBe("תשובה");
    expect(generateText).toHaveBeenCalledOnce();
    const [prompt, opts] = generateText.mock.calls[0];
    expect(prompt).toContain("השוטה");
    expect(opts).toEqual({ maxTokens: 3000 });
    vi.doUnmock("./_core/aiProvider");
  });
});
