import { describe, expect, it } from "vitest";
import { render } from "./entry-server";

describe("entry-server render", () => {
  it("returns non-empty html and a helmet context for a route", async () => {
    const result = await render("/iching");

    expect(result.html.length).toBeGreaterThan(0);
    // Stable marker from SiteLayout's header.
    expect(result.html).toContain("רוּחַ");
    expect(result.helmetContext).toBeTypeOf("object");
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
});
