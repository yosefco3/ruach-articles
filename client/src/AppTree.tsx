import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { trpc } from "@/lib/trpc";
import App from "./App";

export interface AppTreeProps {
  queryClient: QueryClient;
  trpcClient: ReturnType<typeof trpc.createClient>;
  /** `ssrPath` for wouter on the server; undefined on the client (uses window.location). */
  location?: string;
}

/**
 * Single source of truth for the React tree + providers, rendered identically
 * on the server (prerender) and the client (`hydrateRoot`). Providers are
 * injected so the same tree is reused without duplicating the provider stack.
 *
 * The document <head> is rendered server-side by seo.ts (applySeoToHtml) and
 * kept current on the client via useDocumentTitle — react-helmet-async is not
 * used because it does not populate its context under React 19 prerender.
 */
export function AppTree({ queryClient, trpcClient, location }: AppTreeProps) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router ssrPath={location}>
          <App />
        </Router>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
