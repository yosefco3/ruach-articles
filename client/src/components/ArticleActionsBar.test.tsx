import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";

const state = vi.hoisted(() => ({
  user: null as { role: string; dbId: number } | null,
  featured: undefined as { id: number } | undefined,
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ featured: { get: { invalidate: vi.fn() } } }),
    featured: {
      get: { useQuery: () => ({ data: state.featured }) },
      set: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

// Safe as a static import: vi.mock calls above are hoisted ahead of it.
import ArticleActionsBar from "./ArticleActionsBar";

const article = { id: 3, authorId: 7, published: true };

/** wouter's Link needs a router; ssrPath keeps it out of the browser location. */
const render = (props: { id: number; authorId?: number | null; published?: boolean }) =>
  renderToString(
    <Router ssrPath="/article/x">
      <ArticleActionsBar article={props} />
    </Router>,
  );

describe("ArticleActionsBar", () => {
  beforeEach(() => {
    state.user = null;
    state.featured = undefined;
  });

  it("renders nothing for anonymous readers", () => {
    expect(render(article)).toBe("");
  });

  it("renders nothing for a signed-in reader who did not write it", () => {
    state.user = { role: "user", dbId: 8 };
    expect(render(article)).toBe("");
  });

  it("gives the author an edit link but no featured button", () => {
    state.user = { role: "user", dbId: 7 };
    const html = render(article);
    expect(html).toContain("ערוך מאמר");
    expect(html).toContain("/admin/edit/3?from=article");
    expect(html).not.toContain("הפוך למאמר הראשי");
  });

  it("gives an admin both actions on someone else's article", () => {
    state.user = { role: "admin", dbId: 99 };
    const html = render(article);
    expect(html).toContain("ערוך מאמר");
    expect(html).toContain("הפוך למאמר הראשי");
  });

  it("marks the button as done when this article is already featured", () => {
    state.user = { role: "admin", dbId: 99 };
    state.featured = { id: 3 };
    const html = render(article);
    expect(html).toContain("זהו המאמר הראשי");
    expect(html).toContain("disabled");
  });

  it("flags an unpublished article as a draft", () => {
    state.user = { role: "admin", dbId: 99 };
    const html = render({ ...article, published: false });
    expect(html).toContain("טיוטה");
  });
});
