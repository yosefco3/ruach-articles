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
      bySlug: { query: vi.fn(async (i: { slug: string }) => ({ slug: i.slug, title: "T", bookRole: "chapter" })) },
      chaptersOfBook: { query: vi.fn(async (i: { bookId: number; role: string }) => [{ id: 10, role: i.role, bookId: i.bookId }]) },
    },
    teachers: {
      list: { query: vi.fn(async () => [{ id: 1, slug: "yonatan" }]) },
      bySlug: { query: vi.fn(async (i: { slug: string }) => ({ id: 1, slug: i.slug })) },
      articlesOf: { query: vi.fn(async (i: { teacherId: number }) => [{ id: 77, teacherId: i.teacherId }]) },
    },
    books: {
      list: { query: vi.fn(async () => [{ id: 5, slug: "derech-haruach" }]) },
      bySlug: { query: vi.fn(async (i: { slug: string }) => (i.slug === "missing" ? undefined : { id: 5, slug: i.slug })) },
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
    ).toMatchObject({ slug: "my-slug", title: "T" });
  });

  it("/book/:slug prefetches the book and then its chapters and materials by id", async () => {
    const qc = new QueryClient();
    const client = makeFakeClient();
    await runSsrPrefetch(qc, asClient(client), "/book/derech-haruach");
    expect(qc.getQueryData(getQueryKey(trpc.books.bySlug, { slug: "derech-haruach" }, "query"))).toMatchObject({ id: 5 });
    expect(client.articles.chaptersOfBook.query).toHaveBeenCalledWith({ bookId: 5, role: "chapter" });
    expect(client.articles.chaptersOfBook.query).toHaveBeenCalledWith({ bookId: 5, role: "material" });
    expect(qc.getQueryData(getQueryKey(trpc.articles.chaptersOfBook, { bookId: 5, role: "material" }, "query"))).toEqual([{ id: 10, role: "material", bookId: 5 }]);
  });

  it("/book/:slug with a missing book skips the dependent queries", async () => {
    const qc = new QueryClient();
    const client = makeFakeClient();
    await runSsrPrefetch(qc, asClient(client), "/book/missing");
    expect(client.articles.chaptersOfBook.query).not.toHaveBeenCalled();
  });

  it("/book/:book/:slug prefetches book, article and the sibling list of the article's role", async () => {
    const qc = new QueryClient();
    const client = makeFakeClient();
    await runSsrPrefetch(qc, asClient(client), "/book/derech-haruach/mavo");
    expect(client.articles.bySlug.query).toHaveBeenCalledWith({ slug: "mavo" });
    expect(client.articles.chaptersOfBook.query).toHaveBeenCalledTimes(1);
    expect(client.articles.chaptersOfBook.query).toHaveBeenCalledWith({ bookId: 5, role: "chapter" });
  });

  it("/teacher/:slug prefetches the teacher and then their articles", async () => {
    const qc = new QueryClient();
    const client = makeFakeClient();
    await runSsrPrefetch(qc, asClient(client), "/teacher/yonatan");
    expect(client.teachers.articlesOf.query).toHaveBeenCalledWith({ teacherId: 1 });
    expect(qc.getQueryData(getQueryKey(trpc.teachers.articlesOf, { teacherId: 1 }, "query"))).toEqual([{ id: 77, teacherId: 1 }]);
  });
});
