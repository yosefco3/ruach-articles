import { describe, it, expect, beforeEach } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";
import { __resetRateLimit } from "../_core/rateLimit";

describe("iching.getContent", () => {
  it("is public and merges hexagrams, trigrams and intro", async () => {
    const hexagrams = [{ number: 1, interpretation: "h" }];
    const trigrams = [{ trigramKey: "qian", description: "t" }];
    const intro = { articleHtml: "a", questionPrompt: "q" };
    const { caller, db } = makeCaller(publicCtx(), {
      listHexagramTexts: async () => hexagrams,
      listTrigramTexts: async () => trigrams,
      getIchingIntro: async () => intro,
    });
    const result = await caller.iching.getContent();
    expect(result).toEqual({ hexagrams, trigrams, intro, aiMonthlyLimit: 5 });
    expect(db.listHexagramTexts).toHaveBeenCalledOnce();
    expect(db.listTrigramTexts).toHaveBeenCalledOnce();
    expect(db.getIchingIntro).toHaveBeenCalledOnce();
  });
});

describe("iching.upsertHexagram", () => {
  it("persists the input then returns the refreshed hexagram", async () => {
    const saved = { number: 11, interpretation: "x" };
    const { caller, db } = makeCaller(adminCtx(), {
      getHexagramText: async () => saved,
    });
    const input = {
      number: 11,
      name: "הַשָּׁלוֹם",
      trigramExplanation: "te",
      interpretation: "i",
      line1: "", line2: "", line3: "", line4: "", line5: "", line6: "",
    };
    const result = await caller.iching.upsertHexagram(input);
    expect(db.upsertHexagramText).toHaveBeenCalledWith(input);
    expect(db.getHexagramText).toHaveBeenCalledWith(11);
    expect(result).toEqual(saved);
  });

  it("rejects a hexagram number outside 1..64 (zod)", async () => {
    const { caller } = makeCaller(adminCtx());
    await expect(
      caller.iching.upsertHexagram({
        number: 99,
        trigramExplanation: "te",
        interpretation: "i",
      }),
    ).rejects.toBeDefined();
  });

  it("defaults name and the six line texts to empty strings", async () => {
    const { caller, db } = makeCaller(adminCtx());
    await caller.iching.upsertHexagram({
      number: 5,
      trigramExplanation: "te",
      interpretation: "i",
    });
    expect(db.upsertHexagramText).toHaveBeenCalledWith({
      number: 5,
      name: "",
      trigramExplanation: "te",
      interpretation: "i",
      line1: "", line2: "", line3: "", line4: "", line5: "", line6: "",
    });
  });
});

describe("iching admin guards", () => {
  it("upsertHexagram rejects public (UNAUTHORIZED) and users (FORBIDDEN)", async () => {
    const input = { number: 1, trigramExplanation: "t", interpretation: "i" };
    await expect(
      makeCaller(publicCtx()).caller.iching.upsertHexagram(input),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      makeCaller(userCtx()).caller.iching.upsertHexagram(input),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("upsertTrigram rejects public (UNAUTHORIZED) and users (FORBIDDEN)", async () => {
    const input = { trigramKey: "qian" as const, description: "d" };
    await expect(
      makeCaller(publicCtx()).caller.iching.upsertTrigram(input),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      makeCaller(userCtx()).caller.iching.upsertTrigram(input),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("updateIntro rejects public (UNAUTHORIZED) and users (FORBIDDEN)", async () => {
    await expect(
      makeCaller(publicCtx()).caller.iching.updateIntro({ buttonLabel: "x" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      makeCaller(userCtx()).caller.iching.updateIntro({ buttonLabel: "x" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lets an admin toggle refineEnabled and forwards it to updateIchingIntro", async () => {
    const { caller, db } = makeCaller(adminCtx(), { getIchingIntro: async () => ({}) });
    await caller.iching.updateIntro({ refineEnabled: false });
    expect(db.updateIchingIntro).toHaveBeenCalledWith({ refineEnabled: false });
  });

  it("lets an admin upsert a trigram (name/element/attr default to empty)", async () => {
    const { caller, db } = makeCaller(adminCtx());
    await caller.iching.upsertTrigram({ trigramKey: "kun", description: "d" });
    expect(db.upsertTrigramText).toHaveBeenCalledWith({
      trigramKey: "kun",
      name: "",
      element: "",
      attr: "",
      description: "d",
    });
  });
});

describe("iching.interpret", () => {
  const input = {
    question: "האם כדאי לי להחליף עבודה?",
    baseName: "היצירה",
    baseText: "כוח יוצר טהור.",
  };

  it("rejects an anonymous caller with UNAUTHORIZED", async () => {
    await expect(
      makeCaller(publicCtx()).caller.iching.interpret(input),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns an interpretation and increments usage when under the quota", async () => {
    const { caller, db, generateIchingInterpretation } = makeCaller(
      userCtx({ dbId: 7 }),
      { getMonthlyUsage: async () => 0, incrementMonthlyUsage: async () => 1 },
      { ichingAiMonthlyLimit: 5 },
    );
    const result = await caller.iching.interpret(input);
    expect(result.interpretation).toBe("פירוש לדוגמה");
    expect(result.usage).toEqual({ used: 1, limit: 5, remaining: 4 });
    expect(generateIchingInterpretation).toHaveBeenCalledOnce();
    expect(db.getMonthlyUsage).toHaveBeenCalledWith(7);
    expect(db.incrementMonthlyUsage).toHaveBeenCalledOnce();
  });

  it("forwards the changing lines to the generator", async () => {
    const { caller, generateIchingInterpretation } = makeCaller(
      userCtx({ dbId: 7 }),
      { getMonthlyUsage: async () => 0, incrementMonthlyUsage: async () => 1 },
      { ichingAiMonthlyLimit: 5 },
    );
    await caller.iching.interpret({
      ...input,
      changingLines: [{ line: 3, text: "מעבר" }],
    });
    expect(generateIchingInterpretation).toHaveBeenCalledWith(
      expect.objectContaining({ changingLines: [{ line: 3, text: "מעבר" }] }),
    );
  });

  it("throws FORBIDDEN at the quota and never calls Gemini or increments", async () => {
    const { caller, db, generateIchingInterpretation } = makeCaller(
      userCtx({ dbId: 7 }),
      { getMonthlyUsage: async () => 5 },
      { ichingAiMonthlyLimit: 5 },
    );
    await expect(caller.iching.interpret(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "QUOTA_EXCEEDED",
    });
    expect(generateIchingInterpretation).not.toHaveBeenCalled();
    expect(db.incrementMonthlyUsage).not.toHaveBeenCalled();
  });

  it("lets an admin bypass the quota without incrementing", async () => {
    const { caller, db, generateIchingInterpretation } = makeCaller(
      adminCtx(),
      { getMonthlyUsage: async () => 999 },
      { ichingAiMonthlyLimit: 5 },
    );
    const result = await caller.iching.interpret(input);
    expect(result.interpretation).toBe("פירוש לדוגמה");
    expect(generateIchingInterpretation).toHaveBeenCalledOnce();
    expect(db.getMonthlyUsage).not.toHaveBeenCalled();
    expect(db.incrementMonthlyUsage).not.toHaveBeenCalled();
  });

  it("propagates a Gemini failure and does not increment usage", async () => {
    const { caller, db } = makeCaller(
      userCtx({ dbId: 7 }),
      { getMonthlyUsage: async () => 0 },
      {
        ichingAiMonthlyLimit: 5,
        generateIchingInterpretation: async () => {
          throw new Error("Gemini down");
        },
      },
    );
    await expect(caller.iching.interpret(input)).rejects.toThrow("Gemini down");
    expect(db.incrementMonthlyUsage).not.toHaveBeenCalled();
  });
});

describe("iching.refineQuestion", () => {
  beforeEach(() => __resetRateLimit());

  it("is public and returns the evaluator's suggestions", async () => {
    const evaluate = async () => ({
      problematic: true,
      suggestions: ["מהי הדינמיקה של הקשר?", "כיצד נכון לפעול בקשר?"],
    });
    const { caller, evaluateIchingQuestion } = makeCaller(publicCtx(), {}, {
      evaluateIchingQuestion: evaluate,
    });

    const res = await caller.iching.refineQuestion({ question: "האם הוא אוהב אותי?" });
    expect(res).toEqual({
      problematic: true,
      suggestions: ["מהי הדינמיקה של הקשר?", "כיצד נכון לפעול בקשר?"],
    });
    expect(evaluateIchingQuestion).toHaveBeenCalledWith("האם הוא אוהב אותי?");
  });

  it("fail-open once the per-IP hourly limit is exceeded, and stops calling the evaluator", async () => {
    const { caller, evaluateIchingQuestion } = makeCaller(publicCtx(), {}, {
      refineRatePerHour: 2,
      evaluateIchingQuestion: async () => ({ problematic: true, suggestions: ["x"] }),
    });

    // שתי הקריאות הראשונות עוברות (בתוך התקרה)…
    await caller.iching.refineQuestion({ question: "שאלה אחת" });
    await caller.iching.refineQuestion({ question: "שאלה שתיים" });
    expect(evaluateIchingQuestion).toHaveBeenCalledTimes(2);

    // …השלישית חוצה את התקרה → fail-open בלי קריאת AI נוספת.
    const res = await caller.iching.refineQuestion({ question: "שאלה שלוש" });
    expect(res).toEqual({ problematic: false, suggestions: [] });
    expect(evaluateIchingQuestion).toHaveBeenCalledTimes(2);
  });

  it("rejects an empty question (zod)", async () => {
    const { caller } = makeCaller(publicCtx());
    await expect(caller.iching.refineQuestion({ question: "  " })).rejects.toBeDefined();
  });

  it("rejects a question longer than 500 chars (zod)", async () => {
    const { caller } = makeCaller(publicCtx());
    await expect(
      caller.iching.refineQuestion({ question: "א".repeat(501) }),
    ).rejects.toBeDefined();
  });
});
