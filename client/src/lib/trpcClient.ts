import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";

/**
 * Shared factory for the tRPC client, used by both entry points.
 *
 * - The client passes nothing → relative `/api/trpc` + `globalThis.fetch` with
 *   `credentials: "include"` (sends the session cookie).
 * - The server (entry-server) injects an absolute `url` and a `fetch` bound to
 *   the incoming request's cookies, so SSR prefetch runs as the logged-in user.
 */
export function makeTrpcClient(opts?: { url?: string; fetch?: typeof fetch }) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: opts?.url ?? "/api/trpc",
        transformer: superjson,
        fetch:
          opts?.fetch ??
          ((input, init) =>
            globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: "include",
            })),
      }),
    ],
  });
}
