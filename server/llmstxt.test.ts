import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module to prevent env validation chain
vi.mock("./db", () => ({
  getArticles: vi.fn(),
}));
vi.mock("./db/tarot", () => ({
  listCardTexts: vi.fn().mockResolvedValue([]),
}));

import { serveLlmsTxt } from "./llmstxt";
import { getArticles } from "./db";
import { SITE_URL_PRODUCTION } from "@shared/const";

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn(),
  } as any;
}

describe("llms.txt", () => {
  beforeEach(() => {
    vi.mocked(getArticles).mockReset();
  });

  it("serves a markdown index with title, summary and key pages", async () => {
    vi.mocked(getArticles).mockResolvedValue([] as any);
    const res = mockRes();

    await serveLlmsTxt({} as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({ "Content-Type": "text/markdown; charset=utf-8" }),
    );
    const body = res.send.mock.calls[0][0] as string;
    expect(body).toMatch(/^# רוח חכמה/);
    expect(body).toContain("> אתר מאמרים בעברית");
    expect(body).toContain(`(${SITE_URL_PRODUCTION}/derech)`);
    expect(body).toContain(`(${SITE_URL_PRODUCTION}/iching)`);
    expect(body).toContain(`(${SITE_URL_PRODUCTION}/tarot)`);
    expect(body).toContain(`(${SITE_URL_PRODUCTION}/tarot/deck)`);
    expect(body).toContain(`(${SITE_URL_PRODUCTION}/rss.xml)`);
  });

  it("lists published articles as markdown links with excerpts", async () => {
    vi.mocked(getArticles).mockResolvedValue([
      { title: "מאמר ראשון", slug: "first", excerpt: "תקציר  עם\nשבירת שורה" },
      { title: "מאמר שני", slug: "second", excerpt: null },
    ] as any);
    const res = mockRes();

    await serveLlmsTxt({} as any, res);

    expect(getArticles).toHaveBeenCalledWith({ published: true });
    const body = res.send.mock.calls[0][0] as string;
    // Excerpt whitespace is collapsed so each entry stays a single list line.
    expect(body).toContain(
      `- [מאמר ראשון](${SITE_URL_PRODUCTION}/article/first): תקציר עם שבירת שורה`,
    );
    expect(body).toContain(`- [מאמר שני](${SITE_URL_PRODUCTION}/article/second)\n`);
  });

  it("still serves the static index when the DB fails", async () => {
    vi.mocked(getArticles).mockRejectedValue(new Error("db down"));
    const res = mockRes();

    await serveLlmsTxt({} as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0] as string;
    expect(body).toContain("## עמודים מרכזיים");
    expect(body).toContain("## Optional");
  });
});

describe("llms.txt — tarot card pages", () => {
  it("lists all 78 card pages with DB summaries when available", async () => {
    vi.mocked(getArticles).mockResolvedValue([]);
    const { listCardTexts } = await import("./db/tarot");
    vi.mocked(listCardTexts).mockResolvedValue([
      { cardId: "major-00", name: "", summary: "התחלה חדשה", interpretation: "" },
    ] as any);
    const res = mockRes();
    await serveLlmsTxt({} as any, res);
    const md = res.send.mock.calls[0][0] as string;
    expect(md).toContain("## פירושי קלפי הטארוט");
    expect(md).toContain(`${SITE_URL_PRODUCTION}/tarot/card/the-fool`);
    expect(md).toContain("התחלה חדשה");
    expect((md.match(/\/tarot\/card\//g) || []).length).toBe(78);
  });

  it("still lists the 78 links when the tarot DB read fails", async () => {
    vi.mocked(getArticles).mockResolvedValue([]);
    const { listCardTexts } = await import("./db/tarot");
    vi.mocked(listCardTexts).mockRejectedValue(new Error("db down"));
    const res = mockRes();
    await serveLlmsTxt({} as any, res);
    const md = res.send.mock.calls[0][0] as string;
    expect((md.match(/\/tarot\/card\//g) || []).length).toBe(78);
  });
});
