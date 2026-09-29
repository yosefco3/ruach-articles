// @vitest-environment happy-dom
/**
 * בדיקה חיה של ה-hook (לא רינדור סטטי): רכיב אמיתי, QueryClient אמיתי, שעון מדומה.
 * מכונת המצבים עצמה נבדקת ב-pages/tarot/job.test.ts; כאן נבדק החיבור לרשת ול-polling.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { JobState } from "@/pages/tarot/job";
import { POLL_MS, useTarotJob, type TarotJobApi } from "./useTarotJob";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Result = { text: string };
type Hook = ReturnType<typeof useTarotJob<string, Result>>;

/** שגיאה בצורת TRPCClientError: message + data.code (חסר = לא הגיעה תשובת שרת). */
function trpcError(message: string, code?: string) {
  return Object.assign(new Error(message), { data: code ? { code } : undefined });
}

let root: Root;
let container: HTMLElement;
let hook: Hook;
let onDone: ReturnType<typeof vi.fn>;

function mount(api: TarotJobApi<string, Result>, isBusinessError?: (code?: string, message?: string) => boolean) {
  const queryClient = new QueryClient();
  function Probe() {
    hook = useTarotJob<string, Result>(api, { onDone, isBusinessError });
    return null;
  }
  container = document.createElement("div");
  root = createRoot(container);
  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    );
  });
}

/** מקדם את השעון המדומה ונותן ל-promises ולרינדורים להתיישב. */
async function tick(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  // פתיחת עבודה → רינדור → הפעלת השאילתה → תשובה: כמה סבבים של רינדור ו-promises.
  // מילישנייה בכל סבב: react-query מודיע על תוצאה דרך טיימר, לא באותו tick.
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  onDone = vi.fn();
});

afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe("useTarotJob (live)", () => {
  it("run → pending → polls until done → reports the result once", async () => {
    const states: JobState<Result>[] = [
      { status: "pending" },
      { status: "pending" },
      { status: "done", result: { text: "פירוש" } },
    ];
    const start = vi.fn(async () => ({ jobId: "j1" }));
    const poll = vi.fn(async () => states.shift() ?? { status: "pending" as const });
    mount({ key: "t", start, poll });

    expect(hook.pending).toBe(false);
    act(() => hook.run("קלט"));
    expect(hook.pending).toBe(true);

    await tick();
    expect(start).toHaveBeenCalledWith("קלט");
    expect(poll).toHaveBeenCalledWith("j1");
    expect(hook.pending).toBe(true);

    await tick(POLL_MS);
    expect(hook.pending).toBe(true);
    await tick(POLL_MS);

    expect(hook.pending).toBe(false);
    expect(hook.result).toEqual({ text: "פירוש" });
    expect(hook.error).toBeNull();
    expect(onDone).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledWith({ text: "פירוש" });

    // אחרי done מפסיקים לשאול
    const calls = poll.mock.calls.length;
    await tick(POLL_MS * 3);
    expect(poll.mock.calls.length).toBe(calls);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("a job lost AFTER a successful poll restarts silently with the same input", async () => {
    const start = vi
      .fn<(input: string) => Promise<{ jobId: string }>>()
      .mockResolvedValueOnce({ jobId: "j1" })
      .mockResolvedValueOnce({ jobId: "j2" });
    let lost = false;
    const poll = vi.fn(async (jobId: string): Promise<JobState<Result>> => {
      if (jobId === "j2") return { status: "done", result: { text: "אחרי התחלה מחדש" } };
      if (lost) throw trpcError("JOB_NOT_FOUND", "NOT_FOUND");
      return { status: "pending" };
    });
    mount({ key: "t", start, poll });

    act(() => hook.run("קלט"));
    await tick();
    expect(hook.pending).toBe(true); // בדיקה מוצלחת אחת: pending

    lost = true; // השרת אותחל — העבודה נעלמה
    await tick(POLL_MS);
    await tick(10_000); // ניסיונות חוזרים של react-query + פתיחת העבודה החדשה
    await tick(POLL_MS);

    expect(start).toHaveBeenCalledTimes(2);
    expect(start).toHaveBeenLastCalledWith("קלט");
    expect(hook.result).toEqual({ text: "אחרי התחלה מחדש" });
    expect(hook.error).toBeNull();
    expect(hook.failures).toBe(0);
  });

  it("a job lost twice in one run ends as a counted failure", async () => {
    const start = vi
      .fn<(input: string) => Promise<{ jobId: string }>>()
      .mockResolvedValueOnce({ jobId: "j1" })
      .mockResolvedValueOnce({ jobId: "j2" });
    const poll = vi.fn(async (): Promise<JobState<Result>> => {
      throw trpcError("JOB_NOT_FOUND", "NOT_FOUND");
    });
    mount({ key: "t", start, poll });

    act(() => hook.run("קלט"));
    await tick();
    await tick(10_000);
    await tick(10_000);

    expect(start).toHaveBeenCalledTimes(2);
    expect(hook.pending).toBe(false);
    expect(hook.error).toMatchObject({ code: "NOT_FOUND", business: false });
    expect(hook.failures).toBe(1);
    expect(onDone).not.toHaveBeenCalled();
  });

  it("a network blip while polling is not an error — it keeps polling and finishes", async () => {
    const start = vi.fn(async () => ({ jobId: "j1" }));
    let offline = true;
    const poll = vi.fn(async (): Promise<JobState<Result>> => {
      if (offline) throw trpcError("Failed to fetch");
      return { status: "done", result: { text: "חזרה הרשת" } };
    });
    mount({ key: "t", start, poll });

    act(() => hook.run("קלט"));
    await tick();
    await tick(10_000);
    expect(hook.pending).toBe(true);
    expect(hook.error).toBeNull();
    expect(hook.failures).toBe(0);

    offline = false;
    await tick(POLL_MS);
    await tick(POLL_MS);
    expect(hook.result).toEqual({ text: "חזרה הרשת" });
  });

  it("a provider error reported by the job is a counted failure; retry opens a new job", async () => {
    const start = vi
      .fn<(input: string) => Promise<{ jobId: string }>>()
      .mockResolvedValueOnce({ jobId: "j1" })
      .mockResolvedValueOnce({ jobId: "j2" });
    const poll = vi.fn(async (jobId: string): Promise<JobState<Result>> =>
      jobId === "j1" ? { status: "error", message: "DeepSeek 500" } : { status: "done", result: { text: "ok" } },
    );
    mount({ key: "t", start, poll });

    act(() => hook.run("קלט"));
    await tick();
    expect(hook.error).toEqual({ message: "DeepSeek 500", business: false });
    expect(hook.failures).toBe(1);

    act(() => hook.run("קלט"));
    expect(hook.error).toBeNull();
    await tick();
    expect(hook.result).toEqual({ text: "ok" });
    expect(hook.failures).toBe(0);
  });

  it("a business error on start is surfaced with its code and is not counted", async () => {
    const start = vi.fn(async () => {
      throw trpcError("QUOTA_EXCEEDED", "FORBIDDEN");
    });
    const poll = vi.fn();
    mount({ key: "t", start, poll }, (code) => code === "FORBIDDEN");

    act(() => hook.run("קלט"));
    await tick();
    expect(hook.pending).toBe(false);
    expect(hook.error).toEqual({ code: "FORBIDDEN", message: "QUOTA_EXCEEDED", business: true });
    expect(hook.failures).toBe(0);
    expect(poll).not.toHaveBeenCalled();
  });

  it("a real error on start is counted", async () => {
    const start = vi.fn(async () => {
      throw trpcError("boom", "INTERNAL_SERVER_ERROR");
    });
    mount({ key: "t", start, poll: vi.fn() }, (code) => code === "FORBIDDEN");

    act(() => hook.run("קלט"));
    await tick();
    expect(hook.error).toMatchObject({ business: false });
    expect(hook.failures).toBe(1);
  });
});
