import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// env נטען פעם אחת; ממקמים אותו כאובייקט שניתן למוטציה (כמו ב-ichingAi.provider.test.ts).
vi.mock("./_core/env", () => ({
  env: {
    ICHING_AI_PROVIDER: "deepseek",
    DEEPSEEK_API_KEY: "test-key",
    DEEPSEEK_MODEL: "deepseek-chat",
    DEEPSEEK_BASE_URL: "https://api.deepseek.com",
    DEEPSEEK_TEMPERATURE: 0.7,
    GEMINI_API_KEY: "",
    GEMINI_MODEL: "gemini-2.5-flash",
  },
}));

import { env } from "./_core/env";
import { buildQuestionRefinePrompt, evaluateIchingQuestion } from "./ichingAi";

/** מעטפת תשובת DeepSeek תקינה עם תוכן נתון. */
const dsOk = (content: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content } }] }),
  text: async () => "",
});

describe("buildQuestionRefinePrompt (pure)", () => {
  it("includes the question, the JSON shape, and a preferred opening phrase", () => {
    const prompt = buildQuestionRefinePrompt("האם הוא אוהב אותי?");
    expect(prompt).toContain("האם הוא אוהב אותי?");
    expect(prompt).toContain('{"problematic": boolean, "suggestions": string[]}');
    expect(prompt).toContain("מהי הדינמיקה של");
  });
});

describe("evaluateIchingQuestion", () => {
  beforeEach(() => {
    env.ICHING_AI_PROVIDER = "deepseek";
    env.DEEPSEEK_API_KEY = "test-key";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("parses two suggestions from valid JSON and trims them", async () => {
    const payload = JSON.stringify({
      problematic: true,
      suggestions: ["  מהי הדינמיקה של הקשר?  ", "כיצד נכון לפעול בקשר?"],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(dsOk(payload)));

    const res = await evaluateIchingQuestion("האם הוא אוהב אותי?");
    expect(res).toEqual({
      problematic: true,
      suggestions: ["מהי הדינמיקה של הקשר?", "כיצד נכון לפעול בקשר?"],
    });
  });

  it("extracts JSON even when wrapped in a ```json fence", async () => {
    const fenced = '```json\n{"problematic": true, "suggestions": ["מה נכון להבין?"]}\n```';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(dsOk(fenced)));

    const res = await evaluateIchingQuestion("מה יהיה?");
    expect(res).toEqual({ problematic: true, suggestions: ["מה נכון להבין?"] });
  });

  it("caps to two suggestions and drops blank entries", async () => {
    const payload = JSON.stringify({
      problematic: true,
      suggestions: ["א", "   ", "ב", "ג"],
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(dsOk(payload)));

    const res = await evaluateIchingQuestion("שאלה");
    expect(res.suggestions).toEqual(["א", "ב"]);
  });

  it("fail-open: problematic=false → suggestions ignored", async () => {
    const payload = JSON.stringify({ problematic: false, suggestions: ["x"] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(dsOk(payload)));

    await expect(evaluateIchingQuestion("מה נכון להבין לגבי המעבר?")).resolves.toEqual({
      problematic: false,
      suggestions: [],
    });
  });

  it("fail-open: problematic=true but no usable suggestion", async () => {
    const payload = JSON.stringify({ problematic: true, suggestions: ["   ", ""] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(dsOk(payload)));

    await expect(evaluateIchingQuestion("שאלה")).resolves.toEqual({
      problematic: false,
      suggestions: [],
    });
  });

  it("fail-open: non-JSON response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(dsOk("מצטער, לא הבנתי")));
    await expect(evaluateIchingQuestion("שאלה")).resolves.toEqual({
      problematic: false,
      suggestions: [],
    });
  });

  it("fail-open: provider throws (empty content)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(dsOk("   ")));
    await expect(evaluateIchingQuestion("שאלה")).resolves.toEqual({
      problematic: false,
      suggestions: [],
    });
  });

  it("fail-open: missing API key never throws out", async () => {
    env.DEEPSEEK_API_KEY = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(evaluateIchingQuestion("שאלה")).resolves.toEqual({
      problematic: false,
      suggestions: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
