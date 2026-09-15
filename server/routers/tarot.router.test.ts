import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimit } from "../_core/rateLimit";
import { __resetJobs } from "../_core/jobs";
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

describe("tarot.myUsage", () => {
  it("rejects guests with UNAUTHORIZED", async () => {
    const { caller } = makeCaller(publicCtx());
    await expect(caller.tarot.myUsage()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns the remaining quota for a regular user", async () => {
    const { caller } = makeCaller(
      userCtx(),
      { getTarotMonthlyUsage: async () => 3 },
      { tarotAiMonthlyLimit: 5 },
    );
    expect(await caller.tarot.myUsage()).toEqual({
      used: 3,
      limit: 5,
      remaining: 2,
      unlimited: false,
    });
  });

  it("clamps remaining to 0 when usage exceeds the limit", async () => {
    const { caller } = makeCaller(
      userCtx(),
      { getTarotMonthlyUsage: async () => 9 },
      { tarotAiMonthlyLimit: 5 },
    );
    expect((await caller.tarot.myUsage()).remaining).toBe(0);
  });

  it("admins are unlimited and the counter is not read", async () => {
    const { caller, db } = makeCaller(adminCtx(), {}, { tarotAiMonthlyLimit: 5 });
    const res = await caller.tarot.myUsage();
    expect(res.unlimited).toBe(true);
    expect(res.remaining).toBe(5);
    expect(db.getTarotMonthlyUsage).not.toHaveBeenCalled();
  });
});

type Caller = ReturnType<typeof makeCaller>["caller"];
type InterpretInput = Parameters<Caller["tarot"]["interpret"]>[0];

/** מפעיל את עבודת הפירוש וממתין לסיומה — מחזיר את התוצאה או זורק את שגיאת העבודה. */
async function interpretDone(caller: Caller, input: InterpretInput) {
  const { jobId } = await caller.tarot.interpret(input);
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setImmediate(r));
    const job = await caller.tarot.interpretResult({ jobId });
    if (job.status === "done") return job.result;
    if (job.status === "error") throw new Error(job.message);
  }
  throw new Error("job did not settle");
}

describe("tarot.interpret", () => {
  beforeEach(() => __resetJobs());

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
    const res = await interpretDone(caller, { question: "מה נכון להבין?", cards: CARDS });
    expect(res.interpretation).toBe("פירוש טארוט לדוגמה");
    expect(res.usage).toEqual({ used: 2, limit: 5, remaining: 3 });
    expect(generateTarotInterpretation).toHaveBeenCalledWith({
      question: "מה נכון להבין?",
      cards: CARDS,
      spread: { kind: "three", options: [] },
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
    const res = await interpretDone(caller, { question: "ש", cards: CARDS });
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
    await expect(interpretDone(caller, { question: "ש", cards: CARDS })).rejects.toThrow(/provider down/);
    expect(db.incrementTarotMonthlyUsage).not.toHaveBeenCalled();
  });

  it("allows an empty question (general reading) but rejects a wrong card count", async () => {
    const { caller } = makeCaller(userCtx(), {
      getTarotMonthlyUsage: async () => 0,
      incrementTarotMonthlyUsage: async () => 1,
    });
    const ok = await interpretDone(caller, { question: "", cards: CARDS });
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

describe("tarot.chooseSpread", () => {
  beforeEach(() => __resetRateLimit());

  it("rejects guests with UNAUTHORIZED (the AI chooses only for signed-in users)", async () => {
    const { caller } = makeCaller(publicCtx());
    await expect(caller.tarot.chooseSpread({ question: "א או ב?" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("AI master switch off → three, without calling the AI", async () => {
    const { caller, chooseTarotSpread } = makeCaller(userCtx(), {
      getTarotIntro: async () => ({ aiEnabled: false }),
    });
    expect(await caller.tarot.chooseSpread({ question: "א או ב?" })).toEqual({ kind: "three", options: [] });
    expect(chooseTarotSpread).not.toHaveBeenCalled();
  });

  it("returns what the AI service chose when the switch is on", async () => {
    const choice = { kind: "choice", options: ["א", "ב"] };
    const { caller, chooseTarotSpread } = makeCaller(
      userCtx(),
      { getTarotIntro: async () => ({ aiEnabled: true }) },
      { chooseTarotSpread: async () => choice },
    );
    expect(await caller.tarot.chooseSpread({ question: "א או ב?" })).toEqual(choice);
    expect(chooseTarotSpread).toHaveBeenCalledWith("א או ב?");
  });

  it("over the per-user hourly cap → three (fail-open), AI not called", async () => {
    const { caller, chooseTarotSpread } = makeCaller(
      userCtx(),
      { getTarotIntro: async () => ({ aiEnabled: true }) },
      { chooseTarotSpread: async () => ({ kind: "choice", options: ["א", "ב"] }), spreadRatePerHour: 2 },
    );
    await caller.tarot.chooseSpread({ question: "ש" });
    await caller.tarot.chooseSpread({ question: "ש" });
    expect(await caller.tarot.chooseSpread({ question: "ש" })).toEqual({ kind: "three", options: [] });
    expect(chooseTarotSpread).toHaveBeenCalledTimes(2);
  });

  it("rejects an empty question", async () => {
    const { caller } = makeCaller(userCtx(), { getTarotIntro: async () => ({ aiEnabled: true }) });
    await expect(caller.tarot.chooseSpread({ question: "   " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("tarot.interpretResult", () => {
  beforeEach(() => __resetJobs());
  const enabled = () => ({
    getTarotIntro: async () => ({ aiEnabled: true }),
    getTarotMonthlyUsage: async () => 0,
    incrementTarotMonthlyUsage: async () => 1,
  });

  it("interpret returns a jobId immediately; the result is pending, then done", async () => {
    let release!: (v: string) => void;
    const { caller } = makeCaller(userCtx(), enabled(), {
      generateTarotInterpretation: () => new Promise<string>((r) => (release = r)),
    });
    const { jobId } = await caller.tarot.interpret({ question: "ש", cards: CARDS });
    expect(jobId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await caller.tarot.interpretResult({ jobId })).toEqual({ status: "pending" });
    release("פירוש");
    await new Promise((r) => setImmediate(r));
    expect(await caller.tarot.interpretResult({ jobId })).toEqual({
      status: "done",
      result: { interpretation: "פירוש", usage: { used: 1, limit: 5, remaining: 4 } },
    });
  });

  it("another user cannot read the job (NOT_FOUND); unknown/invalid ids are rejected", async () => {
    const { caller } = makeCaller(userCtx(), enabled());
    const { jobId } = await caller.tarot.interpret({ question: "ש", cards: CARDS });
    const other = makeCaller({ ...userCtx(), user: { ...userCtx().user!, dbId: 999 } }, enabled()).caller;
    await expect(other.tarot.interpretResult({ jobId })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.tarot.interpretResult({ jobId: "not-a-uuid" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.tarot.interpretResult({ jobId: "00000000-0000-4000-8000-000000000000" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("guests get UNAUTHORIZED", async () => {
    const { caller } = makeCaller(publicCtx());
    await expect(
      caller.tarot.interpretResult({ jobId: "00000000-0000-4000-8000-000000000000" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("tarot.interpret — spread plans", () => {
  beforeEach(() => __resetJobs());
  const SIX = [...CARDS, ...CARDS];
  const CHOICE = { kind: "choice" as const, options: ["לעבור דירה", "להישאר"] };
  const enabled = () => ({
    getTarotIntro: async () => ({ aiEnabled: true }),
    getTarotMonthlyUsage: async () => 0,
    incrementTarotMonthlyUsage: async () => 1,
  });

  it("choice with 6 cards passes and the AI service receives the spread", async () => {
    const { caller, generateTarotInterpretation } = makeCaller(userCtx(), enabled());
    const res = await interpretDone(caller, { question: "ש", cards: SIX, spread: CHOICE });
    expect(res.interpretation).toBe("פירוש טארוט לדוגמה");
    expect(generateTarotInterpretation).toHaveBeenCalledWith({ question: "ש", cards: SIX, spread: CHOICE });
  });

  it("card count must match the plan: choice with 3 cards, or no spread with 6 cards → BAD_REQUEST", async () => {
    const { caller, generateTarotInterpretation, db } = makeCaller(userCtx(), enabled());
    await expect(caller.tarot.interpret({ question: "ש", cards: CARDS, spread: CHOICE })).rejects.toMatchObject({
      message: "SPREAD_SIZE_MISMATCH",
    });
    await expect(caller.tarot.interpret({ question: "ש", cards: SIX })).rejects.toMatchObject({
      message: "SPREAD_SIZE_MISMATCH",
    });
    expect(generateTarotInterpretation).not.toHaveBeenCalled();
    expect(db.incrementTarotMonthlyUsage).not.toHaveBeenCalled();
  });

  it("a choice spread with a single option is normalized to three (so 3 cards pass, 4 do not)", async () => {
    const { caller, generateTarotInterpretation } = makeCaller(userCtx(), enabled());
    await interpretDone(caller, { question: "ש", cards: CARDS, spread: { kind: "choice", options: ["רק אחת"] } });
    expect(generateTarotInterpretation.mock.calls[0][0]).toMatchObject({ spread: { kind: "three" } });
  });

  it("rejects more than 10 cards at the schema level", async () => {
    const { caller } = makeCaller(userCtx(), enabled());
    const eleven = Array.from({ length: 11 }, () => CARDS[0]);
    await expect(caller.tarot.interpret({ question: "ש", cards: eleven })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
