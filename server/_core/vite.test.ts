import { describe, it, expect } from "vitest";
import { isImmutableAsset } from "./vite";

describe("isImmutableAsset", () => {
  it("matches Vite content-hashed build outputs", () => {
    expect(isImmutableAsset("/assets/index-DFa4nFoc.js")).toBe(true);
    expect(isImmutableAsset("/assets/style-a1b2c3d4.css")).toBe(true);
    expect(isImmutableAsset("/assets/logo-0123abcd.svg")).toBe(true);
    expect(isImmutableAsset("/assets/font-deadbeef.woff2")).toBe(true);
  });

  it("does not match HTML, manifests, or unhashed files", () => {
    expect(isImmutableAsset("/index.html")).toBe(false);
    expect(isImmutableAsset("/manifest.json")).toBe(false);
    expect(isImmutableAsset("/robots.txt")).toBe(false);
    expect(isImmutableAsset("/favicon.png")).toBe(false);
    expect(isImmutableAsset("/og-image.jpg")).toBe(false);
  });
});
