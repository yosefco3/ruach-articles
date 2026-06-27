import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

const tmpDir = path.join(os.tmpdir(), `ruach-test-del-${Date.now()}`);

// Capture LOCAL_UPLOAD_DIR before importing storage, and force local (no R2) mode.
process.env.LOCAL_UPLOAD_DIR = tmpDir;

vi.mock("./_core/env", () => ({
  env: { NODE_ENV: "development" },
  isR2Configured: () => false,
}));

const { deleteObject, keyFromUrl } = await import("./storage");

describe("keyFromUrl", () => {
  it("passes a bare key through", () => {
    expect(keyFromUrl("attachments/abc.jpg")).toBe("attachments/abc.jpg");
  });

  it("strips the /uploads/ prefix (relative and absolute)", () => {
    expect(keyFromUrl("/uploads/attachments/abc.jpg")).toBe("attachments/abc.jpg");
    expect(keyFromUrl("https://ruach.test/uploads/attachments/abc.jpg")).toBe(
      "attachments/abc.jpg",
    );
  });

  it("rejects path traversal", () => {
    expect(keyFromUrl("/uploads/../../etc/passwd")).toBeNull();
    expect(keyFromUrl("attachments/../secret")).toBeNull();
  });

  it("returns null for external / unrecognised URLs and empty input", () => {
    expect(keyFromUrl("https://example.com/some/external.jpg")).toBeNull();
    expect(keyFromUrl("")).toBeNull();
  });
});

describe("deleteObject (local mode)", () => {
  beforeEach(() => {
    fs.mkdirSync(path.join(tmpDir, "attachments"), { recursive: true });
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("deletes an existing file given its /uploads/ URL", async () => {
    const dest = path.join(tmpDir, "attachments", "x.txt");
    fs.writeFileSync(dest, "data");
    expect(fs.existsSync(dest)).toBe(true);

    const removed = await deleteObject("/uploads/attachments/x.txt");
    expect(removed).toBe(true);
    expect(fs.existsSync(dest)).toBe(false);
  });

  it("returns false (no throw) when the file is already gone", async () => {
    expect(await deleteObject("/uploads/attachments/missing.txt")).toBe(false);
  });

  it("refuses to delete outside the upload dir", async () => {
    expect(await deleteObject("/uploads/../../escape.txt")).toBe(false);
  });

  it("returns false for external URLs", async () => {
    expect(await deleteObject("https://example.com/external.jpg")).toBe(false);
  });
});
