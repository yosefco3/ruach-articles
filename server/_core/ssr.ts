import type { Request } from "express";

export interface HtmlParts {
  /** The app markup to place inside #root. */
  appHtml: string;
  /** Head tags (helmet) injected at the <!--ssr-head--> anchor (step 07). */
  head?: string;
  /** Serialized dehydrated state injected at <!--ssr-state--> (step 06). */
  state?: string;
}

/**
 * Assemble the final HTML document from the index.html template and the
 * server-rendered parts. Shared by dev (step 04) and prod (step 05).
 */
export function renderHtml(template: string, parts: HtmlParts): string {
  return template
    .replace("<!--ssr-head-->", parts.head ?? "")
    .replace('<div id="root"></div>', `<div id="root">${parts.appHtml}</div>`)
    .replace("<!--ssr-state-->", parts.state ?? "");
}

/**
 * A `fetch` for SSR-side tRPC calls that targets this server and carries the
 * incoming request's cookie, so prefetch (step 06) runs as the logged-in user.
 * entry-server issues requests to a sentinel `http://internal` origin which we
 * rewrite to this server's real origin.
 */
export function makeSsrFetch(req: Request): typeof fetch {
  // Prefer the loopback origin captured at startup (avoids an external
  // round-trip through the public domain in production); fall back to the
  // request's own host.
  const origin =
    process.env.SSR_INTERNAL_ORIGIN ?? `${req.protocol}://${req.get("host")}`;
  const cookie = req.headers.cookie ?? "";

  return ((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const rewritten = urlStr.replace("http://internal", origin);
    return globalThis.fetch(rewritten, {
      ...(init ?? {}),
      headers: {
        ...((init?.headers as Record<string, string>) ?? {}),
        ...(cookie ? { cookie } : {}),
      },
    });
  }) as typeof fetch;
}
