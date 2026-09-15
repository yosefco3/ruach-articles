import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JOB_TTL_MS, __resetJobs, getJob, startJob } from "./jobs";

const flush = () => new Promise((r) => setImmediate(r));

describe("job store", () => {
  beforeEach(() => __resetJobs());
  afterEach(() => vi.useRealTimers());

  it("pending until the promise settles, then done with the result", async () => {
    let resolve!: (v: string) => void;
    const id = startJob(7, () => new Promise<string>((r) => (resolve = r)));
    expect(getJob(id, 7)).toEqual({ status: "pending" });
    resolve("פירוש");
    await flush();
    expect(getJob(id, 7)).toEqual({ status: "done", result: "פירוש" });
  });

  it("a rejected run becomes an error state carrying the message", async () => {
    const id = startJob(7, async () => {
      throw new Error("DeepSeek 500");
    });
    await flush();
    expect(getJob(id, 7)).toEqual({ status: "error", message: "DeepSeek 500" });
  });

  it("only the owner can read the job; unknown ids are null", async () => {
    const id = startJob(7, async () => 1);
    await flush();
    expect(getJob(id, 8)).toBeNull();
    expect(getJob("no-such-job", 7)).toBeNull();
    expect(getJob(id, 7)).toEqual({ status: "done", result: 1 });
  });

  it("finished jobs expire after the TTL; running ones never do", async () => {
    vi.useFakeTimers();
    const done = startJob(7, async () => "x");
    await vi.runAllTimersAsync();
    const running = startJob(7, () => new Promise(() => {}));
    vi.setSystemTime(Date.now() + JOB_TTL_MS + 1);
    expect(getJob(done, 7)).toBeNull();
    expect(getJob(running, 7)).toEqual({ status: "pending" });
  });
});
