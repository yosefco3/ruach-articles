import { describe, expect, it } from "vitest";
import { render as baseRender } from "./entry-server";

/**
 * The SSR render prefetches its data over HTTP through the injected fetch. In
 * tests there is no backend, so we stub fetch to answer the tRPC batch calls.
 * Without this the page renders its data-loading state ("טוען…") instead of the
 * real content, and the lazy-resolution assertion can never pass.
 *
 * httpBatchLink (v11, superjson) sends GET .../api/trpc/<a>,<b>?batch=1&input=…
 * and expects a JSON array of { result: { data: { json: value } } } in the same
 * order as the comma-separated procedures in the path.
 */
function mockSsrFetch(): typeof fetch {
  const values: Record<string, unknown> = {
    "iching.getContent": {
      hexagrams: [],
      trigrams: [],
      intro: {
        articleHtml: "<p>מבוא</p>",
        questionPrompt: "מהי שאלתך?",
        questionHint: "השאלה נשמרת במכשירך בלבד",
        buttonLabel: "הַטֵּל",
      },
    },
    "settings.get": null,
    "categories.list": [],
    "auth.me": null,
  };
  return (async (input: Parameters<typeof fetch>[0]) => {
    const url = typeof input === "string" ? input : input.toString();
    const path = url.split("?")[0];
    const marker = "/api/trpc/";
    const procs = path
      .slice(path.indexOf(marker) + marker.length)
      .split(",")
      .map(decodeURIComponent);
    const body = procs.map((p) => ({
      result: { data: { json: p in values ? values[p] : null } },
    }));
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

const render = (url: string) => baseRender(url, { fetch: mockSsrFetch() });

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
