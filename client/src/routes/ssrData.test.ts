import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { trpc } from "@/lib/trpc";
import { runSsrPrefetch } from "./ssrData";

// A minimal stand-in for the tRPC client: each procedure exposes a .query().
function makeFakeClient() {
  return {
    settings: { get: { query: vi.fn(async () => ({ siteTitle: "DB Title" })) } },
    categories: {
      list: { query: vi.fn(async () => [{ slug: "philosophy" }]) },
      listWithCounts: { query: vi.fn(async () => [{ slug: "philosophy", count: 3 }]) },
      bySlug: { query: vi.fn(async (i: { slug: string }) => ({ slug: i.slug })) },
    },
    auth: { me: { query: vi.fn(async () => null) } },
    featured: { get: { query: vi.fn(async () => null) } },
    iching: { getContent: { query: vi.fn(async () => ({ marker: "ICHING_DATA" })) } },
    articles: {
      list: { query: vi.fn(async () => [{ id: 1, title: "A" }]) },
      bySlug: { query: vi.fn(async (i: { slug: string }) => ({ slug: i.slug, title: "T" })) },
    },
  };
}

type FakeClient = ReturnType<typeof makeFakeClient>;
const asClient = (c: FakeClient) =>
  c as unknown as Parameters<typeof runSsrPrefetch>[1];

describe("runSsrPrefetch", () => {
  it("prefetches global queries under the keys the hooks use", async () => {
    const qc = new QueryClient();
    const client = makeFakeClient();

    await runSsrPrefetch(qc, asClient(client), "/some-unmapped-route");

    expect(
      qc.getQueryData(getQueryKey(trpc.settings.get, undefined, "query"))
    ).toEqual({ siteTitle: "DB Title" });
    expect(
      qc.getQueryData(getQueryKey(trpc.categories.list, undefined, "query"))
    ).toEqual([{ slug: "philosophy" }]);
    // auth.me returning null is still cached (anonymous SSR).
    expect(
      qc.getQueryState(getQueryKey(trpc.auth.me, undefined, "query"))?.status
    ).toBe("success");
  });

  it("prefetches /iching content under getContent's key", async () => {
    const qc = new QueryClient();
    const client = makeFakeClient();

    await runSsrPrefetch(qc, asClient(client), "/iching");

    expect(
      qc.getQueryData(getQueryKey(trpc.iching.getContent, undefined, "query"))
    ).toEqual({ marker: "ICHING_DATA" });
  });

  it("matches param routes and passes params to the query", async () => {
    const qc = new QueryClient();
    const client = makeFakeClient();

    await runSsrPrefetch(qc, asClient(client), "/article/my-slug");

    expect(client.articles.bySlug.query).toHaveBeenCalledWith({
      slug: "my-slug",
    });
    expect(
      qc.getQueryData(
        getQueryKey(trpc.articles.bySlug, { slug: "my-slug" }, "query")
      )
    ).toEqual({ slug: "my-slug", title: "T" });
  });
});
