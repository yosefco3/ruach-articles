import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimit } from "../_core/rateLimit";
import { __resetJobs } from "../_core/jobs";
import { MAX_FOLLOWUPS } from "@shared/tarot";
import {
  READING_TOKEN_TTL_MS,
  __resetFollowUps,
  issueReadingToken,
  verifyReadingToken,
} from "../tarotReadingToken";
import { adminCtx, makeCaller, publicCtx, userCtx } from "../test-helpers/trpc";

/** הסוד שבו test-helpers חותם אסימונים (ברירת המחדל של makeDeps). */
const TOKEN_SECRET = "test-reading-token-secret";

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
      result: {
        interpretation: "פירוש",
        usage: { used: 1, limit: 5, remaining: 4 },
        readingToken: expect.any(String),
        followUpsLeft: MAX_FOLLOWUPS,
      },
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

describe("tarot.interpret — reading token", () => {
  beforeEach(() => {
    __resetJobs();
    __resetFollowUps();
  });

  it("a finished interpretation carries a valid reading token and the full follow-up allowance", async () => {
    const { caller } = makeCaller(userCtx(), {
      getTarotMonthlyUsage: async () => 0,
      incrementTarotMonthlyUsage: async () => 1,
    });
    const res = await interpretDone(caller, { question: "ש", cards: CARDS });
    expect(res.followUpsLeft).toBe(MAX_FOLLOWUPS);
    expect(verifyReadingToken(res.readingToken, 1, TOKEN_SECRET).ok).toBe(true);
    // האסימון שייך למשתמש שקיבל את הפירוש בלבד
    expect(verifyReadingToken(res.readingToken, 2, TOKEN_SECRET).ok).toBe(false);
  });

  it("admins get a token too", async () => {
    const { caller } = makeCaller(adminCtx());
    const res = await interpretDone(caller, { question: "ש", cards: CARDS });
    expect(verifyReadingToken(res.readingToken, 99, TOKEN_SECRET).ok).toBe(true);
  });
});

type FollowUpInput = Parameters<Caller["tarot"]["followUp"]>[0];

/** מפעיל את עבודת שאלת ההמשך וממתין לסיומה — מחזיר את התוצאה או זורק את שגיאת העבודה. */
async function followUpDone(caller: Caller, input: FollowUpInput) {
  const { jobId } = await caller.tarot.followUp(input);
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setImmediate(r));
    const job = await caller.tarot.followUpResult({ jobId });
    if (job.status === "done") return job.result;
    if (job.status === "error") throw new Error(job.message);
  }
  throw new Error("job did not settle");
}

describe("tarot.followUp", () => {
  beforeEach(() => {
    __resetJobs();
    __resetRateLimit();
    __resetFollowUps();
  });

  const CLARIFIER = { name: "הנזיר", summary: "התבודדות", text: "פירוש הנזיר" };
  const input = (over: Partial<FollowUpInput> = {}): FollowUpInput => ({
    readingToken: issueReadingToken(1, TOKEN_SECRET),
    question: "מה נכון להבין?",
    cards: CARDS,
    interpretation: "**הפירוש שניתן.**",
    previous: [],
    followUp: { question: "למה הכוונה במכשול?", card: CLARIFIER },
    ...over,
  });

  it("rejects guests with UNAUTHORIZED", async () => {
    const { caller } = makeCaller(publicCtx());
    await expect(caller.tarot.followUp(input())).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.tarot.followUpResult({ jobId: "00000000-0000-4000-8000-000000000000" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("answers with the full context, and does NOT touch the monthly quota", async () => {
    const { caller, db, generateTarotFollowUp } = makeCaller(userCtx());
    const res = await followUpDone(caller, input());
    expect(res).toEqual({ answer: "תשובת המשך לדוגמה", followUpsLeft: MAX_FOLLOWUPS - 1 });
    expect(generateTarotFollowUp).toHaveBeenCalledWith({
      question: "מה נכון להבין?",
      cards: CARDS,
      spread: { kind: "three", options: [] },
      interpretation: "**הפירוש שניתן.**",
      previous: [],
      followUp: { question: "למה הכוונה במכשול?", card: CLARIFIER },
    });
    expect(db.getTarotMonthlyUsage).not.toHaveBeenCalled();
    expect(db.incrementTarotMonthlyUsage).not.toHaveBeenCalled();
  });

  it("works end to end with the token that interpret issued", async () => {
    const { caller } = makeCaller(userCtx(), {
      getTarotMonthlyUsage: async () => 0,
      incrementTarotMonthlyUsage: async () => 1,
    });
    const reading = await interpretDone(caller, { question: "ש", cards: CARDS });
    const res = await followUpDone(
      caller,
      input({ readingToken: reading.readingToken, interpretation: reading.interpretation }),
    );
    expect(res.answer).toBe("תשובת המשך לדוגמה");
  });

  it("returns a jobId immediately; the result is pending, then done", async () => {
    let release!: (v: string) => void;
    const { caller } = makeCaller(
      userCtx(),
      {},
      { generateTarotFollowUp: () => new Promise<string>((r) => (release = r)) },
    );
    const { jobId } = await caller.tarot.followUp(input());
    expect(await caller.tarot.followUpResult({ jobId })).toEqual({ status: "pending" });
    release("תשובה");
    await new Promise((r) => setImmediate(r));
    expect(await caller.tarot.followUpResult({ jobId })).toEqual({
      status: "done",
      result: { answer: "תשובה", followUpsLeft: MAX_FOLLOWUPS - 1 },
    });
  });

  it("another user cannot read the follow-up job", async () => {
    const owner = makeCaller(userCtx());
    const { jobId } = await owner.caller.tarot.followUp(input());
    const other = makeCaller(userCtx({ dbId: 2 }));
    await expect(other.caller.tarot.followUpResult({ jobId })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("passes the previous turn through to the AI service", async () => {
    const { caller, generateTarotFollowUp } = makeCaller(userCtx());
    const previous = [{ question: "שאלה ראשונה", card: CLARIFIER, answer: "תשובה ראשונה" }];
    await followUpDone(caller, input({ previous }));
    expect(generateTarotFollowUp.mock.calls[0][0]).toMatchObject({ previous });
  });

  it.each([
    ["another user's token", () => issueReadingToken(2, TOKEN_SECRET)],
    ["a token signed with another secret", () => issueReadingToken(1, "some-other-secret-16ch")],
    ["an expired token", () => issueReadingToken(1, TOKEN_SECRET, Date.now() - READING_TOKEN_TTL_MS - 1)],
    ["garbage", () => "not-a-token"],
  ])("rejects %s as READING_EXPIRED, without calling the AI", async (_label, makeToken) => {
    const { caller, generateTarotFollowUp } = makeCaller(userCtx());
    await expect(caller.tarot.followUp(input({ readingToken: makeToken() }))).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "READING_EXPIRED",
    });
    expect(generateTarotFollowUp).not.toHaveBeenCalled();
  });

  it("throws AI_DISABLED when the master switch is off, without calling the AI", async () => {
    const { caller, generateTarotFollowUp } = makeCaller(userCtx(), {
      getTarotIntro: async () => ({ aiEnabled: false }),
    });
    await expect(caller.tarot.followUp(input())).rejects.toMatchObject({ message: "AI_DISABLED" });
    expect(generateTarotFollowUp).not.toHaveBeenCalled();
  });

  it("allows MAX_FOLLOWUPS per reading token, then FOLLOWUP_LIMIT", async () => {
    const { caller, generateTarotFollowUp } = makeCaller(userCtx());
    const readingToken = issueReadingToken(1, TOKEN_SECRET);
    for (let i = 0; i < MAX_FOLLOWUPS; i++) {
      const res = await followUpDone(caller, input({ readingToken }));
      expect(res.followUpsLeft).toBe(MAX_FOLLOWUPS - i - 1);
    }
    await expect(caller.tarot.followUp(input({ readingToken }))).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "FOLLOWUP_LIMIT",
    });
    expect(generateTarotFollowUp).toHaveBeenCalledTimes(MAX_FOLLOWUPS);
  });

  it("a new reading (new token) gets its own allowance", async () => {
    const { caller } = makeCaller(userCtx());
    const first = issueReadingToken(1, TOKEN_SECRET);
    for (let i = 0; i < MAX_FOLLOWUPS; i++) await followUpDone(caller, input({ readingToken: first }));
    const res = await followUpDone(caller, input({ readingToken: issueReadingToken(1, TOKEN_SECRET) }));
    expect(res.followUpsLeft).toBe(MAX_FOLLOWUPS - 1);
  });

  it("parallel requests cannot exceed the per-reading cap", async () => {
    const { caller } = makeCaller(userCtx());
    const readingToken = issueReadingToken(1, TOKEN_SECRET);
    const results = await Promise.allSettled(
      Array.from({ length: MAX_FOLLOWUPS + 2 }, () => caller.tarot.followUp(input({ readingToken }))),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(MAX_FOLLOWUPS);
  });

  it("a provider failure releases the slot (count-on-success)", async () => {
    let fail = true;
    const { caller } = makeCaller(
      userCtx(),
      {},
      {
        generateTarotFollowUp: async () => {
          if (fail) throw new Error("provider down");
          return "תשובה";
        },
      },
    );
    const readingToken = issueReadingToken(1, TOKEN_SECRET);
    await expect(followUpDone(caller, input({ readingToken }))).rejects.toThrow(/provider down/);
    fail = false;
    for (let i = 0; i < MAX_FOLLOWUPS; i++) {
      const res = await followUpDone(caller, input({ readingToken }));
      expect(res.followUpsLeft).toBe(MAX_FOLLOWUPS - i - 1);
    }
  });

  it("over the hourly cap → FOLLOWUP_RATE_LIMITED, and no slot is consumed", async () => {
    const { caller, generateTarotFollowUp } = makeCaller(userCtx(), {}, { followUpRatePerHour: 1 });
    await followUpDone(caller, input());
    const readingToken = issueReadingToken(1, TOKEN_SECRET);
    await expect(caller.tarot.followUp(input({ readingToken }))).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: "FOLLOWUP_RATE_LIMITED",
    });
    expect(generateTarotFollowUp).toHaveBeenCalledOnce();
  });

  it("admins are exempt from the hourly cap but not from the per-reading cap", async () => {
    const { caller } = makeCaller(adminCtx(), {}, { followUpRatePerHour: 1 });
    const readingToken = issueReadingToken(99, TOKEN_SECRET);
    for (let i = 0; i < MAX_FOLLOWUPS; i++) await followUpDone(caller, input({ readingToken }));
    await expect(caller.tarot.followUp(input({ readingToken }))).rejects.toMatchObject({
      message: "FOLLOWUP_LIMIT",
    });
    await followUpDone(caller, input({ readingToken: issueReadingToken(99, TOKEN_SECRET) }));
  });

  it("the card count must match the spread", async () => {
    const { caller } = makeCaller(userCtx());
    await expect(
      caller.tarot.followUp(input({ spread: { kind: "choice", options: ["א", "ב"] } })),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", message: "SPREAD_SIZE_MISMATCH" });
    await followUpDone(
      caller,
      input({ cards: [...CARDS, ...CARDS], spread: { kind: "choice", options: ["א", "ב"] } }),
    );
  });

  it("allows an empty original question (general reading)", async () => {
    const { caller } = makeCaller(userCtx());
    const res = await followUpDone(caller, input({ question: "" }));
    expect(res.answer).toBe("תשובת המשך לדוגמה");
  });

  it("validates the input: empty follow-up, missing interpretation, too many previous turns, overlong question", async () => {
    const { caller, generateTarotFollowUp } = makeCaller(userCtx());
    const turn = { question: "ש", card: CLARIFIER, answer: "ת" };
    const bad: FollowUpInput[] = [
      input({ followUp: { question: "   ", card: CLARIFIER } }),
      input({ interpretation: "  " }),
      input({ previous: Array.from({ length: MAX_FOLLOWUPS }, () => turn) }),
      input({ followUp: { question: "ש".repeat(301), card: CLARIFIER } }),
    ];
    for (const b of bad) {
      await expect(caller.tarot.followUp(b)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(generateTarotFollowUp).not.toHaveBeenCalled();
  });
});
