import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { createRoot, hydrateRoot } from "react-dom/client";
import { AppTree } from "./AppTree";
import { getLoginUrl } from "./const";
import { makeTrpcClient } from "./lib/trpcClient";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (error.message !== UNAUTHED_ERR_MSG) return;
  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = makeTrpcClient();

const rootEl = document.getElementById("root")!;
const tree = <AppTree queryClient={queryClient} trpcClient={trpcClient} />;

// Step 06 will read window.__APP_STATE__ here to seed the query cache.
// Hydrate when the server pre-rendered into #root; otherwise fall back to a
// pure client render. This keeps dev working before the server SSR wiring
// (steps 04/05) lands, with no hydration mismatch on an empty container.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree);
} else {
  createRoot(rootEl).render(tree);
}
