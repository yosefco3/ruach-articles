import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { AppTree } from "./AppTree";

function makeClients() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost/api/trpc",
        transformer: superjson,
      }),
    ],
  });
  return { queryClient, trpcClient };
}

describe("AppTree SSR-safety", () => {
  it("renders to a string in node without touching window/document/localStorage", () => {
    const { queryClient, trpcClient } = makeClients();

    const html = renderToString(
      <AppTree
        queryClient={queryClient}
        trpcClient={trpcClient}
        helmetContext={{}}
        location="/iching"
      />
    );

    // Stable marker from SiteLayout's header (renders before the lazy routes).
    expect(html).toContain("רוּחַ");
  });

  it("honours the injected location (wouter ssrPath)", () => {
    const { queryClient, trpcClient } = makeClients();

    // Different routes must both render without crashing in node.
    for (const location of ["/", "/iching"]) {
      const html = renderToString(
        <AppTree
          queryClient={queryClient}
          trpcClient={trpcClient}
          helmetContext={{}}
          location={location}
        />
      );
      expect(html.length).toBeGreaterThan(0);
    }
  });
});
