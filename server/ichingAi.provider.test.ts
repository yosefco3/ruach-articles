import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// env נטען פעם אחת; ממקמים אותו כאובייקט שניתן למוטציה כדי לכוונן ספק/מפתח לכל טסט.
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
import { evaluateIchingQuestion, generateIchingInterpretation } from "./ichingAi";
import { chooseTarotSpread } from "./tarotAi";

const ctx = { question: "q", baseName: "b", baseText: "t" };

const dsOk = (content: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content } }] }),
  text: async () => "",
});
const dsErr = (status: number, body = "err") => ({
  ok: false,
  status,
  json: async () => ({}),
  text: async () => body,
});

describe("generateIchingInterpretation — provider selection + retry", () => {
  beforeEach(() => {
    env.ICHING_AI_PROVIDER = "deepseek";
    env.DEEPSEEK_API_KEY = "test-key";
    env.DEEPSEEK_TEMPERATURE = 0.7;
    env.GEMINI_API_KEY = "";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("calls DeepSeek with the configured model + temperature and returns the text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(dsOk("פירוש"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateIchingInterpretation(ctx)).resolves.toBe("פירוש");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("deepseek-chat");
    expect(body.temperature).toBe(0.7);
  });

  it("retries a transient 503 then succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(dsErr(503))
      .mockResolvedValueOnce(dsOk("אחרי ניסיון"));
    vi.stubGlobal("fetch", fetchMock);

    const p = generateIchingInterpretation(ctx);
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBe("אחרי ניסיון");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry a non-transient 400 and throws immediately", async () => {
    const fetchMock = vi.fn().mockResolvedValue(dsErr(400, "bad request"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateIchingInterpretation(ctx)).rejects.toThrow(/DeepSeek 400/);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("gives up after 3 attempts on a persistent 503", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(dsErr(503));
    vi.stubGlobal("fetch", fetchMock);

    const p = generateIchingInterpretation(ctx);
    const assertion = expect(p).rejects.toThrow(/DeepSeek 503/);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws when DeepSeek returns empty content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(dsOk("   ")));
    await expect(generateIchingInterpretation(ctx)).rejects.toThrow(/empty/);
  });

  it("adds reasoning headroom on top of the caller's answer budget (max_tokens)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(dsOk("פירוש"));
    vi.stubGlobal("fetch", fetchMock);

    await generateIchingInterpretation(ctx);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    // iching מבקש 3000 טוקני תשובה + REASONING_HEADROOM (20000) לחשיבת המודל.
    expect(body.max_tokens).toBe(23000);
  });

  it("retries a truncated response (finish_reason=length) instead of returning partial text", async () => {
    vi.useFakeTimers();
    const dsTruncated = {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: { content: "**שורת מהות", reasoning_content: "חשיבה ארוכה…" },
            finish_reason: "length",
          },
        ],
      }),
      text: async () => "",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(dsTruncated)
      .mockResolvedValueOnce(dsOk("פירוש מלא"));
    vi.stubGlobal("fetch", fetchMock);

    const p = generateIchingInterpretation(ctx);
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBe("פירוש מלא");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws (not partial text) when every attempt is truncated by max_tokens", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "קטוע" }, finish_reason: "length" }],
      }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const p = generateIchingInterpretation(ctx);
    const assertion = expect(p).rejects.toThrow(/finish_reason=length/);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("empty content with the answer left in the reasoning channel is retried, then reported", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "", reasoning_content: "חשיבה ארוכה…" }, finish_reason: "stop" }],
      }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const p = generateIchingInterpretation(ctx);
    const assertion = expect(p).rejects.toThrow(/reasoning channel/);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("a retry after an empty-content reply returns the real answer", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "", reasoning_content: "טיוטה פנימית" }, finish_reason: "stop" }],
        }),
        text: async () => "",
      })
      .mockResolvedValueOnce(dsOk("פירוש מלא"));
    vi.stubGlobal("fetch", fetchMock);

    const p = generateIchingInterpretation(ctx);
    await vi.runAllTimersAsync();
    // פירוש לעולם אינו נלקח מערוץ החשיבה — זו טיוטה פנימית.
    await expect(p).resolves.toBe("פירוש מלא");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws (without calling the network) when DEEPSEEK_API_KEY is missing", async () => {
    env.DEEPSEEK_API_KEY = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateIchingInterpretation(ctx)).rejects.toThrow(/DEEPSEEK_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("routes to Gemini when ICHING_AI_PROVIDER=gemini (never hits the DeepSeek fetch)", async () => {
    env.ICHING_AI_PROVIDER = "gemini";
    env.GEMINI_API_KEY = "";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateIchingInterpretation(ctx)).rejects.toThrow(/GEMINI_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // ── משימות JSON קצרות: התשובה נלקחת מערוץ החשיבה כש-content ריק ──

  const dsReasoningOnly = (reasoning: string) => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: "", reasoning_content: reasoning }, finish_reason: "stop" }],
    }),
    text: async () => "",
  });

  it("tarot spread choice: a JSON answer left in the reasoning channel is used (no retry, no fallback to three)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        dsReasoningOnly('{"kind":"choice","options":["לפרסם עכשיו","לחכות"],"title":"תזמון פרסום הספר"}'),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(chooseTarotSpread("האם לפרסם את הספר עכשיו או לחכות?")).resolves.toEqual({
      kind: "choice",
      options: ["לפרסם עכשיו", "לחכות"],
      title: "תזמון פרסום הספר",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("tarot spread choice: takes the final JSON when the reasoning holds drafts and prose", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        dsReasoningOnly(
          'The user asks X or Y. Draft {"kind":"three","options":[]}? No — explicit options.\n' +
            'JSON:\n{"kind":"choice","options":["הנדסה","רפואה","משפטים"],"title":"בחירת מסלול"}',
        ),
      ),
    );
    await expect(chooseTarotSpread("איזה מסלול לבחור?")).resolves.toMatchObject({
      kind: "choice",
      options: ["הנדסה", "רפואה", "משפטים"],
    });
  });

  it("tarot spread choice: reasoning without any JSON is retried, then fails open to three", async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue(dsReasoningOnly("רק מחשבות, בלי תשובה"));
    vi.stubGlobal("fetch", fetchMock);

    const p = chooseTarotSpread("לעבור או להישאר?");
    await vi.runAllTimersAsync();
    await expect(p).resolves.toEqual({ kind: "three", options: [] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(warn).toHaveBeenCalled();
  });

  it("iching question check: a JSON answer left in the reasoning channel is used", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        dsReasoningOnly('{"problematic": true, "suggestions": ["מה נכון לי להבין במצב הזה?"]}'),
      ),
    );
    await expect(evaluateIchingQuestion("האם אזכה בלוטו?")).resolves.toEqual({
      problematic: true,
      suggestions: ["מה נכון לי להבין במצב הזה?"],
    });
  });
});
