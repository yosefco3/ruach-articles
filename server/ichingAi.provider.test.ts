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
import { generateIchingInterpretation } from "./ichingAi";

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
});
