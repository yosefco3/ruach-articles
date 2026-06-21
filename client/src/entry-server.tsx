import { dehydrate, QueryClient } from "@tanstack/react-query";
import { prerenderToNodeStream } from "react-dom/static";
import superjson from "superjson";
import { AppTree } from "./AppTree";
import { makeTrpcClient } from "./lib/trpcClient";
import { runSsrPrefetch } from "./routes/ssrData";

export interface RenderResult {
  html: string;
  // <script> that seeds window.__APP_STATE__ for client hydration.
  state: string;
}

async function readableToString(
  stream: NodeJS.ReadableStream
): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Render the app to an HTML string for a given URL, with its tRPC data
 * prefetched into the query cache so the markup contains real content and the
 * client hydrates without a duplicate request.
 *
 * Uses react-dom/static `prerenderToNodeStream`, which awaits every Suspense /
 * React.lazy boundary (unlike `renderToString`, which only emits fallbacks).
 * The prelude is buffered to a string (deterministic, not client-streaming);
 * streaming to the client is the future step 11.
 *
 * `opts.fetch` forwards the request's cookies so prefetch runs as the logged-in
 * user (auth-aware SSR).
 */
export async function render(
  url: string,
  opts?: { fetch?: typeof fetch }
): Promise<RenderResult> {
  const queryClient = new QueryClient({
    defaultOptions: {
      // staleTime keeps hydrated data fresh so the client doesn't refetch it
      // immediately after hydration.
      queries: { staleTime: 60_000, retry: false },
    },
  });
  const trpcClient = makeTrpcClient({
    url: "http://internal/api/trpc",
    fetch: opts?.fetch,
  });

  try {
    await runSsrPrefetch(queryClient, trpcClient, url);
  } catch (e) {
    // A prefetch failure must not blank the page — render with whatever loaded.
    console.error("[SSR] prefetch failed:", e);
  }

  const { prelude } = await prerenderToNodeStream(
    <AppTree
      queryClient={queryClient}
      trpcClient={trpcClient}
      location={url}
    />,
    {
      onError(error) {
        console.error("[SSR] render error:", error);
      },
    }
  );

  const html = await readableToString(prelude);

  // Serialize the dehydrated cache with superjson (matches the tRPC
  // transformer). Escape `<` so the data can't break out of the <script>.
  const serialized = JSON.stringify(
    superjson.serialize(dehydrate(queryClient))
  ).replace(/</g, "\\u003c");
  const state = `<script>window.__APP_STATE__=${serialized}</script>`;

  return { html, state };
}
