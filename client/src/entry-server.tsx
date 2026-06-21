import { QueryClient } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { AppTree } from "./AppTree";
import { makeTrpcClient } from "./lib/trpcClient";

export interface RenderResult {
  html: string;
  // Populated by react-helmet-async during render; consumed in step 07.
  helmetContext: Record<string, unknown>;
}

/**
 * Render the app to an HTML string for a given URL. The server (steps 04/05)
 * calls this per request and injects the result into index.html's #root.
 *
 * `opts.fetch` lets the caller forward the request's cookies so SSR runs as the
 * logged-in user; step 06 adds prefetch + dehydrate before the render here.
 */
export async function render(
  url: string,
  opts?: { fetch?: typeof fetch }
): Promise<RenderResult> {
  const queryClient = new QueryClient();
  const trpcClient = makeTrpcClient({
    url: "http://internal/api/trpc",
    fetch: opts?.fetch,
  });
  const helmetContext: Record<string, unknown> = {};

  const html = renderToString(
    <AppTree
      queryClient={queryClient}
      trpcClient={trpcClient}
      helmetContext={helmetContext}
      location={url}
    />
  );

  return { html, helmetContext };
}
