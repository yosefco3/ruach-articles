import { describe, it, expect, vi } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getArticles: vi.fn().mockResolvedValue([
    {
      slug: "test-article",
      updatedAt: new Date("2026-01-15"),
      createdAt: new Date("2026-01-10"),
    },
    { slug: "mavo", bookId: 5, bookSlug: "derech-haruach", bookVisible: true, createdAt: new Date("2026-02-01") },
    { slug: "hidden-ch", bookId: 6, bookSlug: "secret", bookVisible: false, createdAt: new Date("2026-02-01") },
  ]),
  listBooks: vi.fn().mockResolvedValue([{ slug: "derech-haruach", createdAt: new Date("2026-01-01") }]),
  listTeachers: vi.fn().mockResolvedValue([{ slug: "yonatan", createdAt: new Date("2026-01-01") }]),
}));

import { serveSitemap } from "./sitemap";
import { getArticles, listBooks } from "./db";

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
    expect(xml).toContain("/book/derech-haruach</loc>");
    expect(xml).toContain("/book/derech-haruach/mavo");
    expect(xml).not.toContain("hidden-ch");
    expect(xml).toContain("/teacher/yonatan");
    expect(xml).toContain("/books</loc>");
    expect(xml).not.toContain("/category/");
    expect(xml).toContain("2026-01-15");
  });

  it("includes the /iching flagship page", async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await serveSitemap({} as any, res);

    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain("<loc>https://ruachwisdom.org/iching</loc>");
    expect(xml).toContain("<priority>0.9</priority>");
  });

  it("includes the /tarot flagship page", async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await serveSitemap({} as any, res);

    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain("<loc>https://ruachwisdom.org/tarot</loc>");
  });

  it("includes the /tarot/deck gallery page", async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await serveSitemap({} as any, res);

    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain("<loc>https://ruachwisdom.org/tarot/deck</loc>");
  });

  it("includes the /derech method page", async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await serveSitemap({} as any, res);

    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain("<loc>https://ruachwisdom.org/derech</loc>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("includes the /accessibility statement page", async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await serveSitemap({} as any, res);

    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain("<loc>https://ruachwisdom.org/accessibility</loc>");
  });

  it("includes the public static pages (about, contact)", async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await serveSitemap({} as any, res);

    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain("<loc>https://ruachwisdom.org/about</loc>");
    expect(xml).toContain("<loc>https://ruachwisdom.org/contact</loc>");
    expect(xml).not.toContain("/guest-post");
  });
});
describe("sitemap — tarot card pages", () => {
  it("includes all 78 /tarot/card/<slug> URLs", async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;
    await serveSitemap({} as any, res);
    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain("<loc>https://ruachwisdom.org/tarot/guide</loc>");
    expect(xml).toContain("<loc>https://ruachwisdom.org/tarot/card/the-fool</loc>");
    expect(xml).toContain("<loc>https://ruachwisdom.org/tarot/card/king-of-pentacles</loc>");
    expect((xml.match(/\/tarot\/card\//g) || []).length).toBe(78);
  });
});
