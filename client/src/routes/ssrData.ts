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
