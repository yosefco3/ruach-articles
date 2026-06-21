import { describe, expect, it } from "vitest";
import { render } from "./entry-server";

describe("entry-server render", () => {
  it("returns non-empty html and a hydration state script", async () => {
    const result = await render("/iching");

    expect(result.html.length).toBeGreaterThan(0);
    // Stable marker from SiteLayout's header.
    expect(result.html).toContain("רוּחַ");
    expect(result.state).toContain("window.__APP_STATE__");
  });

  it("resolves lazy route content (prerender awaits Suspense)", async () => {
    // The /iching page is React.lazy; renderToString would only emit the
    // Suspense fallback. prerender must include the actual page title.
    const { html } = await render("/iching");
    expect(html).toContain("אִי צִ׳ינְג");
  });

  it("renders different routes without crashing in node", async () => {
    for (const url of ["/", "/iching"]) {
      const { html } = await render(url);
      expect(html.length).toBeGreaterThan(0);
    }
  });

  it("renders deterministically (no hydration-mismatch sources)", async () => {
    // Same route rendered twice must produce identical markup; a difference
    // would mean a non-deterministic value (Math.random/new Date) in a public
    // render path, which causes hydration mismatches.
    for (const url of ["/", "/iching"]) {
      const a = await render(url);
      const b = await render(url);
      expect(a.html).toEqual(b.html);
    }
  });
});
