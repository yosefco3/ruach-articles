import { describe, expect, it } from "vitest";
import { adminCtx, makeCaller, publicCtx, userCtx } from "../test-helpers/trpc";

const CARDS = [
  { name: "השוטה", summary: "התחלה", text: "פירוש א" },
  { name: "המגדל", summary: "טלטלה", text: "פירוש ב" },
  { name: "הכוכב", summary: "תקווה", text: "פירוש ג" },
];

describe("tarot.getContent", () => {
  it("is public and returns merged content + the configured monthly limit", async () => {
    const { caller } = makeCaller(
      publicCtx(),
      {
        listCardTexts: async () => [{ cardId: "major-00", name: "", summary: "ס", interpretation: "" }],
        getTarotIntro: async () => ({ aiEnabled: false, questionPrompt: "ש?" }),
      },
      { tarotAiMonthlyLimit: 7 },
    );
    const res = await caller.tarot.getContent();
    expect(res.cards).toHaveLength(1);
    expect(res.intro.questionPrompt).toBe("ש?");
    expect(res.aiMonthlyLimit).toBe(7);
  });
});

describe("tarot.interpret", () => {
  it("rejects guests with UNAUTHORIZED", async () => {
    const { caller } = makeCaller(publicCtx());
    await expect(caller.tarot.interpret({ question: "ש", cards: CARDS })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("throws AI_DISABLED when the master switch is off — before any quota check", async () => {
    const { caller, db } = makeCaller(userCtx(), {
      getTarotIntro: async () => ({ aiEnabled: false }),
    });
    await expect(caller.tarot.interpret({ question: "ש", cards: CARDS })).rejects.toMatchObject({
      message: "AI_DISABLED",
    });
    expect(db.getTarotMonthlyUsage).not.toHaveBeenCalled();
  });

  it("returns the interpretation and increments the counter on success", async () => {
    const { caller, db, generateTarotInterpretation } = makeCaller(
      userCtx(),
      {
        getTarotMonthlyUsage: async () => 1,
        incrementTarotMonthlyUsage: async () => 2,
      },
      { tarotAiMonthlyLimit: 5 },
    );
    const res = await caller.tarot.interpret({ question: "מה נכון להבין?", cards: CARDS });
    expect(res.interpretation).toBe("פירוש טארוט לדוגמה");
    expect(res.usage).toEqual({ used: 2, limit: 5, remaining: 3 });
    expect(generateTarotInterpretation).toHaveBeenCalledWith({
      question: "מה נכון להבין?",
      cards: CARDS,
    });
    expect(db.incrementTarotMonthlyUsage).toHaveBeenCalledOnce();
  });

  it("throws QUOTA_EXCEEDED at the limit and does not call the provider", async () => {
    const { caller, generateTarotInterpretation } = makeCaller(
      userCtx(),
      { getTarotMonthlyUsage: async () => 2 },
      { tarotAiMonthlyLimit: 2 },
    );
    await expect(caller.tarot.interpret({ question: "ש", cards: CARDS })).rejects.toMatchObject({
      message: "QUOTA_EXCEEDED",
    });
    expect(generateTarotInterpretation).not.toHaveBeenCalled();
  });

  it("admins bypass the quota and are not counted", async () => {
    const { caller, db } = makeCaller(
      adminCtx(),
      { getTarotMonthlyUsage: async () => 99 },
      { tarotAiMonthlyLimit: 2 },
    );
    const res = await caller.tarot.interpret({ question: "ש", cards: CARDS });
    expect(res.interpretation).toBe("פירוש טארוט לדוגמה");
    expect(db.getTarotMonthlyUsage).not.toHaveBeenCalled();
    expect(db.incrementTarotMonthlyUsage).not.toHaveBeenCalled();
  });

  it("does NOT count usage when the provider call fails (count-on-success)", async () => {
    const { caller, db } = makeCaller(
      userCtx(),
      { getTarotMonthlyUsage: async () => 0 },
      {
        generateTarotInterpretation: async () => {
          throw new Error("provider down");
        },
      },
    );
    await expect(caller.tarot.interpret({ question: "ש", cards: CARDS })).rejects.toThrow(
      /provider down/,
    );
    expect(db.incrementTarotMonthlyUsage).not.toHaveBeenCalled();
  });

  it("allows an empty question (general reading) but rejects a wrong card count", async () => {
    const { caller } = makeCaller(userCtx(), {
      getTarotMonthlyUsage: async () => 0,
      incrementTarotMonthlyUsage: async () => 1,
    });
    const ok = await caller.tarot.interpret({ question: "", cards: CARDS });
    expect(ok.interpretation).toBeTruthy();

    await expect(
      caller.tarot.interpret({ question: "ש", cards: CARDS.slice(0, 2) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.tarot.interpret({ question: "ש", cards: [...CARDS, CARDS[0]] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("tarot admin procedures", () => {
  it("upsertCard/updateIntro reject non-admins", async () => {
    const { caller } = makeCaller(userCtx());
    await expect(
      caller.tarot.upsertCard({ cardId: "major-00", interpretation: "<p>א</p>" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.tarot.updateIntro({ aiEnabled: true })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("upsertCard persists and returns the fresh row for admins", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getCardText: async () => ({ cardId: "major-00", name: "", summary: "ס", interpretation: "<p>א</p>" }),
    });
    const res = await caller.tarot.upsertCard({
      cardId: "major-00",
      summary: "ס",
      interpretation: "<p>א</p>",
    });
    expect(db.upsertCardText).toHaveBeenCalledOnce();
    expect(res?.cardId).toBe("major-00");
  });

  it("updateIntro persists and returns the fresh intro for admins", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getTarotIntro: async () => ({ aiEnabled: true }),
    });
    const res = await caller.tarot.updateIntro({ aiEnabled: true });
    expect(db.updateTarotIntro).toHaveBeenCalledWith({ aiEnabled: true });
    expect(res).toEqual({ aiEnabled: true });
  });
});
