import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import Privacy from "./Privacy";
import Terms from "./Terms";
import Accessibility from "./Accessibility";
import Unsubscribe from "./Unsubscribe";
import SiteLayoutDefault from "@/components/SiteLayout";

function render(node: React.ReactNode, path: string, search = "") {
  const queryClient = new QueryClient();
  const client = trpc.createClient({
    links: [httpBatchLink({ url: "http://localhost:0/api/trpc", transformer: superjson })],
  });
  return renderToString(
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router ssrPath={path} ssrSearch={search}>
          {node}
        </Router>
      </QueryClientProvider>
    </trpc.Provider>,
  );
}

describe("legal pages (static render)", () => {
  it("each page renders its h1", () => {
    expect(render(<Privacy />, "/privacy")).toContain("<h1");
    expect(render(<Terms />, "/terms")).toContain("<h1");
    expect(render(<Accessibility />, "/accessibility")).toContain("<h1");
  });
  it("SiteLayout footer links to /privacy, /terms and /accessibility", () => {
    const html = render(<SiteLayoutDefault>x</SiteLayoutDefault>, "/");
    for (const href of ["/privacy", "/terms", "/accessibility"]) {
      expect(html).toContain(`href="${href}"`);
    }
  });
});

describe("Unsubscribe page (static render)", () => {
  it("with ?email shows the address and a button, and sends nothing on render", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const html = render(<Unsubscribe />, "/unsubscribe", "email=a%40b.com");
    expect(html).toContain("הסרה מרשימת הדיוור");
    expect(html).toContain("a@b.com");
    expect(html).toMatch(/<button[^>]*>הסרה<\/button>/);
    expect(html).not.toContain("הכתובת הוסרה");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("without email shows a labelled input", () => {
    const html = render(<Unsubscribe />, "/unsubscribe");
    expect(html).toContain('for="unsubscribe-email"');
    expect(html).toContain('id="unsubscribe-email"');
  });
});
