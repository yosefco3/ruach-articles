import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFollowUpPrompt,
  buildSpreadChoicePrompt,
  buildTarotPrompt,
  type TarotAiContext,
  type TarotFollowUpContext,
} from "./tarotAi";

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

    // פריסת בחירה — תקציב תשובה גדול יותר
    await generateTarotInterpretation({
      ...ctx,
      cards: [...cards, ...cards],
      spread: { kind: "choice", options: ["א", "ב"] },
    });
    expect(generateText.mock.calls[1][1]).toEqual({ maxTokens: 5000 });
    vi.doUnmock("./_core/aiProvider");
  });
});

describe("buildSpreadChoicePrompt (pure)", () => {
  it("carries the question, both catalog kinds, the yes/no rule and the JSON contract", () => {
    const p = buildSpreadChoicePrompt("לעבור לתל אביב או להישאר בירושלים?");
    expect(p).toContain('"לעבור לתל אביב או להישאר בירושלים?"');
    expect(p).toContain('"three"');
    expect(p).toContain('"choice"');
    expect(p).toContain("או לא?");
    expect(p).toContain("JSON");
    expect(p).toContain("בספק");
    expect(p).toContain('"title"'); // כותרת לשם קובץ בהדפסה
  });
});

describe("chooseTarotSpread (fail-open)", () => {
  async function withProvider(reply: () => Promise<string>) {
    vi.resetModules();
    const generateText = vi.fn(reply);
    vi.doMock("./_core/aiProvider", () => ({ generateText }));
    const mod = await import("./tarotAi");
    return { chooseTarotSpread: mod.chooseTarotSpread, generateText };
  }
  afterEach(() => vi.doUnmock("./_core/aiProvider"));

  it("returns the normalized choice from valid JSON (even inside a code fence)", async () => {
    const { chooseTarotSpread, generateText } = await withProvider(async () =>
      '```json\n{"kind":"choice","options":[" לעבור לתל אביב ","להישאר בירושלים"],"title":"מעבר לתל אביב?"}\n```',
    );
    await expect(chooseTarotSpread("ש")).resolves.toEqual({
      kind: "choice",
      options: ["לעבור לתל אביב", "להישאר בירושלים"],
      title: "מעבר לתל אביב",
    });
    expect(generateText.mock.calls[0][1]).toEqual({ maxTokens: 300, jsonFromReasoning: true });
  });

  it("falls back to three on malformed JSON, provider errors, or an invalid choice", async () => {
    const three = { kind: "three", options: [] };
    let t = await withProvider(async () => "לא JSON בכלל");
    await expect(t.chooseTarotSpread("ש")).resolves.toEqual(three);
    t = await withProvider(async () => {
      throw new Error("boom");
    });
    await expect(t.chooseTarotSpread("ש")).resolves.toEqual(three);
    t = await withProvider(async () => '{"kind":"choice","options":["רק אחת"]}');
    await expect(t.chooseTarotSpread("ש")).resolves.toEqual(three);
  });
});

describe("buildTarotPrompt — choice spread", () => {
  const six = [
    { name: "השוטה", summary: "התחלה", text: "פירוש השוטה" },
    { name: "המגדל", summary: "טלטלה", text: "פירוש המגדל" },
    { name: "הכוכב", summary: "תקווה", text: "פירוש הכוכב" },
    { name: "הקיסרית", summary: "שפע", text: "פירוש הקיסרית" },
    { name: "הנזיר", summary: "התבודדות", text: "פירוש הנזיר" },
    { name: "העולם", summary: "השלמה", text: "פירוש העולם" },
  ];
  const ctx: TarotAiContext = {
    question: "לעבור לתל אביב או להישאר בירושלים?",
    cards: six,
    spread: { kind: "choice", options: ["לעבור לתל אביב", "להישאר בירושלים"] },
  };

  it("names both options, the shared positions, and all six cards in plan order", () => {
    const p = buildTarotPrompt(ctx);
    expect(p).toContain('דרך א׳: "לעבור לתל אביב"');
    expect(p).toContain('דרך ב׳: "להישאר בירושלים"');
    expect(p).toContain("פְּרִיסַת שְׁתֵּי הַדְּרָכִים");
    expect(p).toContain("קלף 1 — מקומך עכשיו");
    expect(p).toContain("קלף 6 — מה שאינך רואה");
    for (const c of six) expect(p).toContain(c.text);
    // סדר: הצומת → א׳ (2) → ב׳ (2) → מה שאינך רואה
    const idx = six.map((c) => p.indexOf(c.text));
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    // תפקידי הדרכים תואמים לקלפים 2-5
    expect(p).toMatch(/קלף 2 — דרך א׳ \("לעבור לתל אביב"\) — מה הדרך מציעה/);
    expect(p).toMatch(/קלף 5 — דרך ב׳ \("להישאר בירושלים"\) — לאן הדרך מובילה/);
  });

  it("uses the comparison method, not the center-card method", () => {
    const p = buildTarotPrompt(ctx);
    expect(p).toContain("השוואת דרכים באותם תפקידים");
    expect(p).toContain("ההכרעה נשארת בידי השואל");
    expect(p).not.toContain("הקלף המרכזי — נושא התשובה");
    expect(p).not.toContain("תומך ומתנגד");
    // גדרות משותפות + חוזה פלט
    expect(p).toContain("שורת מהות");
    expect(p).toContain("דרך פעולה");
    expect(p).toContain("אל תבטיח/י ודאות");
    expect(p).toContain("Markdown");
  });

  it("spread=three (or none) keeps the center-card prompt", () => {
    const withThree = buildTarotPrompt({ question: "ש", cards, spread: { kind: "three", options: [] } });
    expect(withThree).toBe(buildTarotPrompt({ question: "ש", cards }));
    expect(withThree).toContain("קלף 2 (הקלף המרכזי — נושא התשובה)");
  });
});

describe("buildFollowUpPrompt (pure)", () => {
  const clarifier = { name: "הנזיר", summary: "התבודדות", text: "פירוש הנזיר המלא" };
  const base: TarotFollowUpContext = {
    question: "מה נכון להבין במעבר הדירה?",
    cards,
    interpretation: "**המעבר נכון, אבל לא עכשיו.** הקלף המרכזי מראה טלטלה שמפנה מקום.",
    previous: [],
    followUp: { question: "למה הכוונה במכשול שתיארת?", card: clarifier },
  };

  it("carries the original question, the reading, the prior interpretation and the follow-up", () => {
    const p = buildFollowUpPrompt(base);
    expect(p).toContain('השאלה המקורית של המשתמש: "מה נכון להבין במעבר הדירה?"');
    for (const c of cards) expect(p).toContain(c.name);
    expect(p).toContain("קלף 2 (הקלף המרכזי — נושא התשובה)");
    expect(p).toContain(base.interpretation);
    expect(p).toContain('שאלת ההמשך: "למה הכוונה במכשול שתיארת?"');
    expect(p).toContain("הנזיר");
    expect(p).toContain("פירוש הנזיר המלא");
  });

  it("orders the context: reading → interpretation → current follow-up", () => {
    const p = buildFollowUpPrompt(base);
    expect(p.indexOf("השוטה")).toBeLessThan(p.indexOf(base.interpretation));
    expect(p.indexOf(base.interpretation)).toBeLessThan(p.indexOf("שאלת ההמשך:"));
  });

  it("lists previous turns in order, before the current follow-up", () => {
    const p = buildFollowUpPrompt({
      ...base,
      previous: [
        {
          question: "מה הצעד הראשון?",
          card: { name: "הקיסרית", summary: "שפע", text: "פירוש הקיסרית" },
          answer: "תשובה ראשונה על הצעד",
        },
        {
          question: "מה מעכב אותי?",
          card: { name: "העולם", summary: "השלמה", text: "פירוש העולם" },
          answer: "תשובה שנייה על העיכוב",
        },
      ],
    });
    const first = p.indexOf('שאלת המשך קודמת 1: "מה הצעד הראשון?"');
    const second = p.indexOf('שאלת המשך קודמת 2: "מה מעכב אותי?"');
    const current = p.indexOf("שאלת ההמשך:");
    expect(first).toBeGreaterThan(-1);
    expect(first).toBeLessThan(second);
    expect(second).toBeLessThan(current);
    expect(p).toContain("הקיסרית");
    expect(p).toContain("תשובה ראשונה על הצעד");
    expect(p).toContain("תשובה שנייה על העיכוב");
  });

  it("has no previous-turns section when there are none", () => {
    expect(buildFollowUpPrompt(base)).not.toContain("שאלות המשך קודמות");
  });

  it("an empty original question becomes a general-reading line, not an empty quote", () => {
    const p = buildFollowUpPrompt({ ...base, question: "   " });
    expect(p).toContain("קריאה כללית");
    expect(p).not.toContain('""');
  });

  it("a choice spread keeps its position roles and anchors the clarifier to the relevant part", () => {
    const p = buildFollowUpPrompt({
      ...base,
      question: "לעבור לתל אביב או להישאר בירושלים?",
      cards: [...cards, ...cards],
      spread: { kind: "choice", options: ["לעבור לתל אביב", "להישאר בירושלים"] },
    });
    expect(p).toContain("מקומך עכשיו");
    expect(p).toContain("מה שאינך רואה — עצה");
    expect(p).toContain('דרך א׳: "לעבור לתל אביב"');
    expect(p).toContain("ביחס לחלק בפריסה ששאלת ההמשך נוגעת בו");
    expect(p).not.toContain("קלף 2 (הקלף המרכזי — נושא התשובה)");
  });

  it("the three-card spread anchors the clarifier to the center card", () => {
    expect(buildFollowUpPrompt(base)).toContain("ביחס לקלף המרכזי של הפריסה");
  });

  it("answers timing questions as ripeness and pace — never a date or a number", () => {
    const p = buildFollowUpPrompt(base);
    expect(p).toContain("שאלות זמן");
    expect(p).toContain("בשלות וקצב");
    expect(p).toContain("אסור לנקוב בתאריך");
    expect(p).toContain("שבועות");
  });

  it("states the clarifier rules: serves the reading, names contradictions, handles a new topic", () => {
    const p = buildFollowUpPrompt(base);
    expect(p).toContain("משרת את הקריאה הקיימת");
    expect(p).toContain("כקול אחד");
    expect(p).toContain("סותר");
    expect(p).toContain("נושא חדש");
    expect(p).toContain("שליפה חדשה");
  });

  it("asks for a short answer, not the long structure of the main reading", () => {
    const p = buildFollowUpPrompt(base);
    expect(p).toContain("עד כ-250 מילים");
    expect(p).toContain("שורת מהות");
    expect(p).toContain("מה זה משנה");
    expect(p).not.toContain("סדר עבודה פנימי");
    expect(p).not.toContain("תומך ומתנגד");
  });

  it("carries the shared guardrails", () => {
    const p = buildFollowUpPrompt(base);
    expect(p).toContain("לא הגדת עתידות");
    expect(p).toContain("אל תצטט");
    expect(p).toContain("אל תבטיח/י ודאות");
    expect(p).toContain("בעברית");
    expect(p).toContain("Markdown");
  });

  it("omits empty summary/text parts of the clarifier instead of dangling dashes", () => {
    const p = buildFollowUpPrompt({
      ...base,
      followUp: { question: "ש", card: { name: "הנזיר", summary: "", text: "" } },
    });
    expect(p).toContain('הקלף המבהיר שנשלף לה: "הנזיר"');
  });
});

describe("generateTarotFollowUp", () => {
  it("delegates to generateText with the follow-up prompt and maxTokens 2000", async () => {
    vi.resetModules();
    const generateText = vi.fn().mockResolvedValue("תשובת המשך");
    vi.doMock("./_core/aiProvider", () => ({ generateText }));
    const { generateTarotFollowUp } = await import("./tarotAi");

    await expect(
      generateTarotFollowUp({
        question: "ש",
        cards,
        interpretation: "פירוש קודם",
        previous: [],
        followUp: { question: "ומה עכשיו?", card: { name: "הנזיר", summary: "", text: "" } },
      }),
    ).resolves.toBe("תשובת המשך");
    expect(generateText).toHaveBeenCalledOnce();
    const [prompt, opts] = generateText.mock.calls[0];
    expect(prompt).toContain("ומה עכשיו?");
    expect(prompt).toContain("פירוש קודם");
    expect(opts).toEqual({ maxTokens: 2000 });
    vi.doUnmock("./_core/aiProvider");
  });
});
