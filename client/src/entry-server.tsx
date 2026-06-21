import { QueryClient } from "@tanstack/react-query";
import { prerenderToNodeStream } from "react-dom/static";
import { AppTree } from "./AppTree";
import { makeTrpcClient } from "./lib/trpcClient";

export interface RenderResult {
  html: string;
  // Populated by react-helmet-async during render; consumed in step 07.
  helmetContext: Record<string, unknown>;
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
 * Render the app to an HTML string for a given URL. The server (steps 04/05)
 * calls this per request and injects the result into index.html's #root.
 *
 * Uses react-dom/static `prerenderToNodeStream`, which awaits every Suspense /
 * React.lazy boundary before resolving — unlike `renderToString`, which only
 * emits fallbacks. We buffer the prelude into a string (deterministic, not
 * client-streaming); streaming to the client is the future step 11.
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

  const { prelude } = await prerenderToNodeStream(
    <AppTree
      queryClient={queryClient}
      trpcClient={trpcClient}
      helmetContext={helmetContext}
      location={url}
    />,
    {
      onError(error) {
        console.error("[SSR] render error:", error);
      },
    }
  );

  const html = await readableToString(prelude);
  return { html, helmetContext };
}
