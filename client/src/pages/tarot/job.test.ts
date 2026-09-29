import { describe, expect, it } from "vitest";
import { initialJob, jobPending, jobReducer, type JobEvent, type JobMachine } from "./job";

type R = { text: string };

function play(events: JobEvent<R>[], from: JobMachine<R> = initialJob<R>()): JobMachine<R> {
  return events.reduce((s, e) => jobReducer(s, e), from);
}

const quota = { code: "FORBIDDEN", message: "QUOTA_EXCEEDED", business: true };
const crash = { code: "INTERNAL_SERVER_ERROR", message: "boom", business: false };

describe("tarot job machine", () => {
  it("starts idle, with nothing pending", () => {
    const s = initialJob<R>();
    expect(s.phase).toBe("idle");
    expect(jobPending(s)).toBe(false);
  });

  it("run → starting → polling → done, and the result is kept", () => {
    const starting = play([{ type: "run" }]);
    expect(starting.phase).toBe("starting");
    expect(starting.startNonce).toBe(1);
    expect(jobPending(starting)).toBe(true);

    const polling = play([{ type: "started", jobId: "j1" }], starting);
    expect(polling).toMatchObject({ phase: "polling", jobId: "j1" });
    expect(jobPending(polling)).toBe(true);

    const done = play([{ type: "polled", jobId: "j1", job: { status: "done", result: { text: "פירוש" } } }], polling);
    expect(done).toMatchObject({ phase: "done", jobId: null, result: { text: "פירוש" }, error: null });
    expect(jobPending(done)).toBe(false);
  });

  it("a pending poll changes nothing (same object — no re-render)", () => {
    const polling = play([{ type: "run" }, { type: "started", jobId: "j1" }]);
    expect(jobReducer(polling, { type: "polled", jobId: "j1", job: { status: "pending" } })).toBe(polling);
  });

  it("a provider error ends the job and counts as a failure", () => {
    const s = play([
      { type: "run" },
      { type: "started", jobId: "j1" },
      { type: "polled", jobId: "j1", job: { status: "error", message: "DeepSeek 500" } },
    ]);
    expect(s).toMatchObject({ phase: "failed", jobId: null, failures: 1 });
    expect(s.error).toEqual({ message: "DeepSeek 500", business: false });
  });

  it("a network blip while polling is ignored — keeps polling, no error", () => {
    const polling = play([{ type: "run" }, { type: "started", jobId: "j1" }]);
    const after = jobReducer(polling, { type: "pollFailed", jobId: "j1", message: "Failed to fetch" });
    expect(after).toBe(polling);
  });

  it("a lost job restarts silently once: back to starting with a new nonce, no error, no failure", () => {
    const polling = play([{ type: "run" }, { type: "started", jobId: "j1" }]);
    const restarted = jobReducer(polling, {
      type: "pollFailed",
      jobId: "j1",
      code: "NOT_FOUND",
      message: "JOB_NOT_FOUND",
    });
    expect(restarted).toMatchObject({
      phase: "starting",
      jobId: null,
      error: null,
      failures: 0,
      autoRestarted: true,
      startNonce: 2,
    });
    expect(jobPending(restarted)).toBe(true);
  });

  it("a job lost twice in one run becomes a real failure", () => {
    const s = play([
      { type: "run" },
      { type: "started", jobId: "j1" },
      { type: "pollFailed", jobId: "j1", code: "NOT_FOUND", message: "JOB_NOT_FOUND" },
      { type: "started", jobId: "j2" },
      { type: "pollFailed", jobId: "j2", code: "NOT_FOUND", message: "JOB_NOT_FOUND" },
    ]);
    expect(s).toMatchObject({ phase: "failed", failures: 1, startNonce: 2 });
    expect(s.error).toEqual({ code: "NOT_FOUND", message: "JOB_NOT_FOUND", business: false });
  });

  it("a fresh run re-arms the silent restart", () => {
    const s = play([
      { type: "run" },
      { type: "started", jobId: "j1" },
      { type: "pollFailed", jobId: "j1", code: "NOT_FOUND", message: "x" },
      { type: "started", jobId: "j2" },
      { type: "pollFailed", jobId: "j2", code: "NOT_FOUND", message: "x" },
      { type: "run" },
      { type: "started", jobId: "j3" },
      { type: "pollFailed", jobId: "j3", code: "NOT_FOUND", message: "x" },
    ]);
    expect(s.phase).toBe("starting");
    expect(s.autoRestarted).toBe(true);
  });

  it("other server errors while polling fail the job", () => {
    const s = play([
      { type: "run" },
      { type: "started", jobId: "j1" },
      { type: "pollFailed", jobId: "j1", code: "INTERNAL_SERVER_ERROR", message: "boom" },
    ]);
    expect(s).toMatchObject({ phase: "failed", failures: 1 });
  });

  it("a business error on start is shown but is not counted as a failure", () => {
    const s = play([{ type: "run" }, { type: "startFailed", error: quota }]);
    expect(s).toMatchObject({ phase: "failed", failures: 0, error: quota });
    expect(jobPending(s)).toBe(false);
  });

  it("a real error on start is counted; failures accumulate across retries", () => {
    const s = play([
      { type: "run" },
      { type: "startFailed", error: crash },
      { type: "run" },
      { type: "startFailed", error: crash },
      { type: "run" },
      { type: "startFailed", error: crash },
    ]);
    expect(s.failures).toBe(3);
  });

  it("run clears the previous error and result but keeps the failure count; success resets it", () => {
    const failed = play([{ type: "run" }, { type: "startFailed", error: crash }]);
    const again = jobReducer(failed, { type: "run" });
    expect(again).toMatchObject({ phase: "starting", error: null, result: null, failures: 1 });
    const done = play(
      [
        { type: "started", jobId: "j2" },
        { type: "polled", jobId: "j2", job: { status: "done", result: { text: "ok" } } },
      ],
      again,
    );
    expect(done.failures).toBe(0);
  });

  it("ignores answers that belong to an older job", () => {
    const polling = play([{ type: "run" }, { type: "started", jobId: "j2" }]);
    expect(
      jobReducer(polling, { type: "polled", jobId: "j1", job: { status: "done", result: { text: "ישן" } } }),
    ).toBe(polling);
    expect(jobReducer(polling, { type: "pollFailed", jobId: "j1", code: "NOT_FOUND", message: "x" })).toBe(polling);
  });

  it("ignores start answers that arrive when nothing is starting", () => {
    const idle = initialJob<R>();
    expect(jobReducer(idle, { type: "started", jobId: "j1" })).toBe(idle);
    expect(jobReducer(idle, { type: "startFailed", error: crash })).toBe(idle);
  });

  it("reset returns to the initial state", () => {
    const s = play([{ type: "run" }, { type: "startFailed", error: crash }, { type: "reset" }]);
    expect(s).toEqual(initialJob<R>());
  });
});
