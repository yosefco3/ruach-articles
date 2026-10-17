import { describe, it, expect } from "vitest";
import { RETIRED_ARTICLE_SLUGS, RETIRED_ARTICLE_TARGET, isRetiredArticle } from "./retiredArticles";

describe("retiredArticles", () => {
  it("holds the 67 archived slugs and nothing that is still live", () => {
    expect(RETIRED_ARTICLE_SLUGS.size).toBe(67);
    expect(isRetiredArticle("urzelcovmd")).toBe(true);
    expect(isRetiredArticle("my-sources-of-authority")).toBe(true);
    expect(isRetiredArticle("")).toBe(false);
    expect(isRetiredArticle("the-fool")).toBe(false);
  });
  it("redirect target is an internal path", () => {
    expect(RETIRED_ARTICLE_TARGET).toMatch(/^\/[a-z]/);
  });
});
