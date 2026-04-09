import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTRPCMsw } from "msw-trpc";
import { appRouter } from "./routers";
import {
  createArticle,
  setFeaturedArticle,
  getFeaturedArticle,
} from "./db";

describe("Featured Article", () => {
  let testArticleId: number;

  beforeAll(async () => {
    // Create a test article
    const result = await createArticle({
      title: "Test Featured Article",
      slug: `test-featured-${Date.now()}`,
      body: "This is a test featured article",
      category: "רוחניות",
      authorId: 1,
      published: true,
    });
    testArticleId = result.id;
  });

  it("should set featured article", async () => {
    await setFeaturedArticle(testArticleId);
    const featured = await getFeaturedArticle();
    expect(featured).toBeDefined();
    expect(featured?.id).toBe(testArticleId);
  });

  it("should get featured article", async () => {
    const featured = await getFeaturedArticle();
    expect(featured).toBeDefined();
    expect(featured?.title).toBe("Test Featured Article");
  });

  it("should update featured article when setting a new one", async () => {
    // Create another test article
    const result = await createArticle({
      title: "Another Test Article",
      slug: `test-featured-2-${Date.now()}`,
      body: "This is another test article",
      category: "פילוסופיה",
      authorId: 1,
      published: true,
    });

    // Set it as featured
    await setFeaturedArticle(result.id);
    const featured = await getFeaturedArticle();
    expect(featured?.id).toBe(result.id);
    expect(featured?.title).toBe("Another Test Article");
  });
});
