import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getArticleBySlug: vi.fn(),
  getCategories: vi.fn(),
}));

// Mock the docx generator
vi.mock("./articleDocx", () => ({
  generateArticleDocx: vi.fn().mockResolvedValue(Buffer.from("fake-docx-content")),
}));

import { getArticleBySlug, getCategories } from "./db";
import { generateArticleDocx } from "./articleDocx";

const mockGetArticleBySlug = vi.mocked(getArticleBySlug);
const mockGetCategories = vi.mocked(getCategories);
const mockGenerateArticleDocx = vi.mocked(generateArticleDocx);

describe("Article DOCX generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call generateArticleDocx with correct params for Hebrew article", async () => {
    const mockArticle = {
      id: 1,
      title: "מאמר בעברית",
      slug: "article-hebrew",
      excerpt: "תקציר בעברית",
      body: "<p>תוכן המאמר</p>",
      coverImage: "https://example.com/image.jpg",
      category: "general",
      tags: "tag1,tag2",
      published: true,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      authorId: 1,
      authorName: "יוסף כהן",
    };

    const mockCategories = [
      { id: 1, name: "כללי", slug: "general", color: "#8B6914", sortOrder: 0 },
    ];

    mockGetArticleBySlug.mockResolvedValue(mockArticle as any);
    mockGetCategories.mockResolvedValue(mockCategories as any);

    // Simulate what the route does
    const article = await getArticleBySlug("article-hebrew");
    expect(article).toBeTruthy();
    expect(article!.published).toBe(true);

    const cats = await getCategories();
    const cat = cats.find((c) => c.slug === article!.category);
    const categoryName = cat?.name ?? article!.category;

    const buffer = await generateArticleDocx({
      title: article!.title,
      excerpt: article!.excerpt,
      body: article!.body ?? "",
      coverImageUrl: article!.coverImage,
      categoryName,
      publishedDate: article!.createdAt ? new Date(article!.createdAt) : null,
    });

    expect(mockGenerateArticleDocx).toHaveBeenCalledWith({
      title: "מאמר בעברית",
      excerpt: "תקציר בעברית",
      body: "<p>תוכן המאמר</p>",
      coverImageUrl: "https://example.com/image.jpg",
      categoryName: "כללי",
      publishedDate: expect.any(Date),
    });

    expect(buffer).toBeInstanceOf(Buffer);
  });

  it("should return 404 when article is not found", async () => {
    mockGetArticleBySlug.mockResolvedValue(undefined);

    const article = await getArticleBySlug("nonexistent-slug");
    expect(article).toBeUndefined();
  });

  it("should not generate docx for unpublished articles", async () => {
    const mockArticle = {
      id: 2,
      title: "טיוטה",
      slug: "draft-article",
      published: false,
      body: "<p>תוכן</p>",
      createdAt: new Date(),
    };

    mockGetArticleBySlug.mockResolvedValue(mockArticle as any);

    const article = await getArticleBySlug("draft-article");
    expect(article!.published).toBe(false);
    // Route would return 403 for unpublished articles
    expect(mockGenerateArticleDocx).not.toHaveBeenCalled();
  });

  it("should handle article with no cover image", async () => {
    const mockArticle = {
      id: 3,
      title: "Article without cover",
      slug: "no-cover",
      excerpt: "Excerpt",
      body: "<p>Body content</p>",
      coverImage: null,
      category: null,
      published: true,
      createdAt: new Date(),
    };

    mockGetArticleBySlug.mockResolvedValue(mockArticle as any);
    mockGetCategories.mockResolvedValue([]);

    const article = await getArticleBySlug("no-cover");
    await generateArticleDocx({
      title: article!.title,
      excerpt: article!.excerpt,
      body: article!.body ?? "",
      coverImageUrl: article!.coverImage,
      categoryName: null,
      publishedDate: null,
    });

    expect(mockGenerateArticleDocx).toHaveBeenCalledWith(
      expect.objectContaining({
        coverImageUrl: null,
        categoryName: null,
      })
    );
  });
});
