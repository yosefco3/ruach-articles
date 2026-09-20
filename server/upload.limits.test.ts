import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES } from "@shared/const";
import { isMimeAllowed } from "./upload";

describe("upload limits", () => {
  it("accepts a 40-minute guided-meditation MP3 (~20MB at 64kbps) and rejects the old 10MB ceiling", () => {
    expect(MAX_UPLOAD_BYTES).toBeGreaterThanOrEqual(20 * 1024 * 1024);
    expect(MAX_UPLOAD_BYTES).toBeGreaterThan(10 * 1024 * 1024);
  });

  it("allows audio and the documented document types, rejects executables", () => {
    expect(isMimeAllowed("audio/mpeg")).toBe(true);
    expect(isMimeAllowed("image/webp")).toBe(true);
    expect(isMimeAllowed("application/pdf")).toBe(true);
    expect(isMimeAllowed("application/x-msdownload")).toBe(false);
    expect(isMimeAllowed("application/octet-stream")).toBe(false);
  });
});
