import { describe, it, expect } from "vitest";
import { LEGACY_ARTICLE_SLUGS, legacyArticleSlugTarget } from "./legacySlugs";

describe("legacy article slugs", () => {
  it("maps the dash slug to its real name", () => {
    expect(legacyArticleSlugTarget("-")).toBe("my-sources-of-authority");
  });
  it("returns null for anything else, including prototype keys", () => {
    expect(legacyArticleSlugTarget("rambam1")).toBeNull();
    expect(legacyArticleSlugTarget("constructor")).toBeNull();
  });
  it("never maps a slug to itself or to another legacy slug (no redirect loops)", () => {
    for (const [from, to] of Object.entries(LEGACY_ARTICLE_SLUGS)) {
      expect(to).not.toBe(from);
      expect(LEGACY_ARTICLE_SLUGS[to]).toBeUndefined();
      expect(to).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
