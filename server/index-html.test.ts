import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Accessibility invariants of the HTML shell (a11y-baseline step 01).
const html = readFileSync(path.resolve(__dirname, "../client/index.html"), "utf8");

describe("client/index.html accessibility shell", () => {
  it("declares Hebrew RTL on the root element", () => {
    expect(html).toMatch(/<html[^>]*lang="he"/);
    expect(html).toMatch(/<html[^>]*dir="rtl"/);
  });

  it("does not block pinch-zoom in the viewport meta (WCAG 1.4.4)", () => {
    const viewport = html.match(/<meta name="viewport" content="([^"]*)"/)?.[1] ?? "";
    expect(viewport).toContain("width=device-width");
    expect(viewport).not.toContain("maximum-scale");
    expect(viewport).not.toContain("user-scalable=no");
  });
});
