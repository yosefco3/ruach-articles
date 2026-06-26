import { describe, it, expect, vi } from "vitest";

vi.mock("./db", () => ({
  getArticles: vi.fn().mockResolvedValue([
    {
      slug: "first-post",
      title: "המאמר הראשון",
      excerpt: "תקציר עם <תווים> & גרשיים",
      category: "רוחניות",
      authorName: "יוסף כהן",
      createdAt: new Date("2026-01-10T12:00:00Z"),
    },
    {
      slug: "second-post",
      title: "מאמר שני",
      excerpt: "",
      category: "פילוסופיה",
      authorName: null,
      createdAt: new Date("2026-01-05T08:00:00Z"),
    },
  ]),
}));

import { serveRss } from "./rss";
import { getArticles } from "./db";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as any;
}

describe("RSS feed", () => {
  it("serves valid RSS 2.0 with one item per published article", async () => {
    const res = mockRes();
    await serveRss({} as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ "Content-Type": expect.stringContaining("application/rss+xml") }),
    );
    const xml = res.send.mock.calls[0][0] as string;
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>\n</rss>");
    expect((xml.match(/<item>/g) || []).length).toBe(2);
    expect(xml).toContain("https://ruachwisdom.org/article/first-post");
    expect(xml).toContain("<pubDate>");
    // atom self link for autodiscovery
    expect(xml).toContain('rel="self"');
  });

  it("escapes special characters and excludes empty author", async () => {
    const res = mockRes();
    await serveRss({} as any, res);
    const xml = res.send.mock.calls[0][0] as string;

    // title is XML-escaped, excerpt is CDATA-wrapped
    expect(xml).toContain("<![CDATA[תקציר עם <תווים> & גרשיים]]>");
    // second post has null author → only one dc:creator overall
    expect((xml.match(/<dc:creator>/g) || []).length).toBe(1);
  });

  it("only requests published articles", async () => {
    const res = mockRes();
    await serveRss({} as any, res);
    expect(getArticles).toHaveBeenCalledWith({ published: true });
  });
});
