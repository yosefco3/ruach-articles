import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";

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
    expect(result).toEqual({ hexagrams, trigrams, intro });
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
      changingLinesNote: "",
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
        changingLinesNote: "",
      }),
    ).rejects.toBeDefined();
  });

  it("defaults name and changingLinesNote to empty strings", async () => {
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
      changingLinesNote: "",
    });
  });
});

describe("iching admin guards", () => {
  it("upsertHexagram rejects public (UNAUTHORIZED) and users (FORBIDDEN)", async () => {
    const input = { number: 1, trigramExplanation: "t", interpretation: "i", changingLinesNote: "" };
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
