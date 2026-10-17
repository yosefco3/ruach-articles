import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { trpc } from "@/lib/trpc";
import type { makeTrpcClient } from "@/lib/trpcClient";

type SsrClient = ReturnType<typeof makeTrpcClient>;

/**
 * Server-side data requirements per route. Each entry prefetches into the
 * QueryClient using the SAME query key the component's `useQuery` produces
 * (via getQueryKey), so the rendered markup has data and the client hydrates
 * without a duplicate request. The fetch goes over HTTP through the request's
 * cookie-forwarding fetch (makeSsrFetch), so prefetch is auth-aware.
 */

/** Prefetch one query; key and fetcher must use the same input. */
function prefetch(
  qc: QueryClient,
  queryKey: QueryKey,
  queryFn: () => Promise<unknown>
): Promise<void> {
  return qc.prefetchQuery({ queryKey, queryFn });
}

/** Queries used by SiteLayout + useAuth on every route. */
function prefetchGlobal(qc: QueryClient, client: SsrClient): Promise<unknown> {
  return Promise.all([
    prefetch(qc, getQueryKey(trpc.settings.get, undefined, "query"), () =>
      client.settings.get.query()
    ),
    prefetch(qc, getQueryKey(trpc.categories.list, undefined, "query"), () =>
      client.categories.list.query()
    ),
    prefetch(qc, getQueryKey(trpc.auth.me, undefined, "query"), () =>
      client.auth.me.query()
    ),
  ]);
}

interface SsrRoute {
  pattern: string;
  prefetch: (
    qc: QueryClient,
    client: SsrClient,
    params: Record<string, string>
  ) => Promise<unknown>;
}

const routes: SsrRoute[] = [
  {
    pattern: "/",
    prefetch: (qc, client) =>
      Promise.all([
        prefetch(
          qc,
          getQueryKey(trpc.categories.listWithCounts, undefined, "query"),
          () => client.categories.listWithCounts.query()
        ),
        prefetch(qc, getQueryKey(trpc.featured.get, undefined, "query"), () =>
          client.featured.get.query()
        ),
        prefetch(qc, getQueryKey(trpc.articles.list, undefined, "query"), () =>
          client.articles.list.query()
        ),
      ]),
  },
  {
    pattern: "/iching",
    prefetch: (qc, client) =>
      prefetch(qc, getQueryKey(trpc.iching.getContent, undefined, "query"), () =>
        client.iching.getContent.query()
      ),
  },
  {
    pattern: "/tarot",
    prefetch: (qc, client) =>
      prefetch(qc, getQueryKey(trpc.tarot.getContent, undefined, "query"), () =>
        client.tarot.getContent.query()
      ),
  },
  {
    // דף קלף בודד משתמש באותו getContent (כל 78 הטקסטים) — אותו query key,
    // כך שה-hydration לא יורה בקשה כפולה.
    pattern: "/tarot/card/:slug",
    prefetch: (qc, client) =>
      prefetch(qc, getQueryKey(trpc.tarot.getContent, undefined, "query"), () =>
        client.tarot.getContent.query()
      ),
  },
  {
    pattern: "/derech",
    prefetch: (qc, client) =>
      prefetch(qc, getQueryKey(trpc.derech.get, undefined, "query"), () =>
        client.derech.get.query()
      ),
  },
  {
    pattern: "/books",
    prefetch: (qc, client) =>
      prefetch(qc, getQueryKey(trpc.books.list, undefined, "query"), () => client.books.list.query()),
  },
  {
    // דף ספר: הספר, ואז הפרקים וחומרי העזר שלו (תלויים ב-id).
    pattern: "/book/:slug",
    prefetch: async (qc, client, p) => {
      const key = getQueryKey(trpc.books.bySlug, { slug: p.slug }, "query");
      await prefetch(qc, key, () => client.books.bySlug.query({ slug: p.slug }));
      const book = qc.getQueryData<{ id: number } | undefined>(key);
      if (!book) return;
      await Promise.all(
        (["chapter", "material"] as const).map((role) =>
          prefetch(qc, getQueryKey(trpc.articles.chaptersOfBook, { bookId: book.id, role }, "query"), () =>
            client.articles.chaptersOfBook.query({ bookId: book.id, role }),
          ),
        ),
      );
    },
  },
  {
    // פרק / חומר עזר: המאמר + הספר + האחים (ל"הפרק הבא").
    pattern: "/book/:book/:slug",
    prefetch: async (qc, client, p) => {
      const bookKey = getQueryKey(trpc.books.bySlug, { slug: p.book }, "query");
      const articleKey = getQueryKey(trpc.articles.bySlug, { slug: p.slug }, "query");
      await Promise.all([
        prefetch(qc, bookKey, () => client.books.bySlug.query({ slug: p.book })),
        prefetch(qc, articleKey, () => client.articles.bySlug.query({ slug: p.slug })),
      ]);
      const book = qc.getQueryData<{ id: number } | undefined>(bookKey);
      const article = qc.getQueryData<{ bookRole?: string } | null | undefined>(articleKey);
      if (!book || !article) return;
      const role = article.bookRole === "material" ? "material" : "chapter";
      await prefetch(qc, getQueryKey(trpc.articles.chaptersOfBook, { bookId: book.id, role }, "query"), () =>
        client.articles.chaptersOfBook.query({ bookId: book.id, role }),
      );
    },
  },
  {
    pattern: "/teachers",
    prefetch: (qc, client) =>
      prefetch(qc, getQueryKey(trpc.teachers.list, undefined, "query"), () => client.teachers.list.query()),
  },
  {
    pattern: "/teacher/:slug",
    prefetch: async (qc, client, p) => {
      const key = getQueryKey(trpc.teachers.bySlug, { slug: p.slug }, "query");
      await prefetch(qc, key, () => client.teachers.bySlug.query({ slug: p.slug }));
      const t = qc.getQueryData<{ id: number } | undefined>(key);
      if (!t) return;
      await prefetch(qc, getQueryKey(trpc.teachers.articlesOf, { teacherId: t.id }, "query"), () =>
        client.teachers.articlesOf.query({ teacherId: t.id }),
      );
    },
  },
  {
    pattern: "/article/:slug",
    prefetch: (qc, client, p) =>
      prefetch(
        qc,
        getQueryKey(trpc.articles.bySlug, { slug: p.slug }, "query"),
        () => client.articles.bySlug.query({ slug: p.slug })
      ),
  },
  {
    pattern: "/category/:slug",
    prefetch: (qc, client, p) =>
      Promise.all([
        prefetch(
          qc,
          getQueryKey(trpc.articles.list, { category: p.slug }, "query"),
          () => client.articles.list.query({ category: p.slug })
        ),
        prefetch(
          qc,
          getQueryKey(trpc.categories.bySlug, { slug: p.slug }, "query"),
          () => client.categories.bySlug.query({ slug: p.slug })
        ),
      ]),
  },
];

/** Match a wouter-style pattern ("/article/:slug") against a URL path. */
function matchPath(
  pattern: string,
  path: string
): Record<string, string> | null {
  const ps = pattern.split("/").filter(Boolean);
  const us = path.split("?")[0].split("/").filter(Boolean);
  if (ps.length !== us.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < ps.length; i++) {
    if (ps[i].startsWith(":")) params[ps[i].slice(1)] = decodeURIComponent(us[i]);
    else if (ps[i] !== us[i]) return null;
  }
  return params;
}

/** Prefetch global + route-specific data for the given URL. */
export async function runSsrPrefetch(
  qc: QueryClient,
  client: SsrClient,
  url: string
): Promise<void> {
  await prefetchGlobal(qc, client);
  for (const route of routes) {
    const params = matchPath(route.pattern, url);
    if (params) {
      await route.prefetch(qc, client, params);
      break;
    }
  }
}
