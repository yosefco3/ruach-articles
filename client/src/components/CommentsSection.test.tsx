import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("@/lib/trpc", () => ({
  trpc: new Proxy({}, {
    get: () => new Proxy({}, {
      get: () => ({
        useQuery: () => ({ data: [], isLoading: false }),
        useMutation: () => ({ mutate: () => {}, isPending: false }),
      }),
    }),
    // useUtils etc.
  }),
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));

import { Router } from "wouter";
import CommentsSection from "./CommentsSection";

describe("CommentsSection privacy notice", () => {
  it("shows the Google sign-in notice with a link to /privacy for guests", () => {
    const html = renderToString(<Router ssrPath="/"><CommentsSection articleId={1} /></Router>);
    expect(html).toContain("בכניסה עם Google האתר מקבל את שמכם");
    expect(html).toContain('href="/privacy"');
  });
});
