import { describe, it, expect, vi } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getArticles: vi.fn().mockResolvedValue([
    {
      slug: "test-article",
      updatedAt: new Date("2026-01-15"),
      createdAt: new Date("2026-01-10"),
    },
  ]),
  getCategories: vi.fn().mockResolvedValue([
    { slug: "spirituality", name: "רוחניות" },
  ]),
}));

import { serveSitemap } from "./sitemap";
import { getArticles, getCategories } from "./db";

describe("Sitemap Generator", () => {
  it("returns valid XML with articles and categories", async () => {
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await serveSitemap(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ "Content-Type": expect.stringContaining("xml") })
    );

    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("https://ruachwisdom.org");
    expect(xml).toContain("/article/test-article");
    expect(xml).toContain("/category/spirituality");
    expect(xml).toContain("2026-01-15");
  });
});