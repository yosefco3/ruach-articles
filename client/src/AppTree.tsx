import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Router } from "wouter";
import { trpc } from "@/lib/trpc";
import App from "./App";

export interface AppTreeProps {
  queryClient: QueryClient;
  trpcClient: ReturnType<typeof trpc.createClient>;
  /** `{}` on the server (helmet fills it); leave undefined on the client. */
  helmetContext?: object;
  /** `ssrPath` for wouter on the server; undefined on the client (uses window.location). */
  location?: string;
}

/**
 * Single source of truth for the React tree + providers, rendered identically
 * on the server (`renderToString`) and the client (`hydrateRoot`). Providers are
 * injected so the same tree is reused without duplicating the provider stack.
 */
export function AppTree({
  queryClient,
  trpcClient,
  helmetContext,
  location,
}: AppTreeProps) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider context={helmetContext}>
          <Router ssrPath={location}>
            <App />
          </Router>
        </HelmetProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
