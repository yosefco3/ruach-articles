import { describe, it, expect, vi } from "vitest";

// Mock the db module to prevent env validation chain
vi.mock("./db", () => ({
  getArticleBySlug: vi.fn(),
  getArticles: vi.fn(),
  getCategoryBySlug: vi.fn(),
  getDerechContent: vi.fn(),
}));
vi.mock("./db/tarot", () => ({ getCardText: vi.fn() }));

import {
  injectMetaTags,
  toAbsoluteImageUrl,
  stripMdLite,
  derechFaqItems,
  resolveDerechSeo,
} from "./seo";
import { getDerechContent } from "./db";
import { DEFAULT_DERECH_CONTENT } from "@shared/derech";
import { SITE_URL_PRODUCTION } from "@shared/const";

describe("SEO Meta Injection", () => {
  const baseHtml = `<!doctype html>
<html lang="he" dir="rtl">
<head>
    <link rel="icon" type="image/png" href="/favicon.png">
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <!-- SEO_HEAD_START -->
    <title>רוח חכמה – מאמרים ברוחניות, פילוסופיה וריפוי</title>
    <meta name="description" content="האתר של יוסף כהן" />
    <!-- SEO_HEAD_END -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
</head>
<body>
    <div id="root"></div>
</body>
</html>`;

  it("replaces SEO tags between markers", () => {
    const result = injectMetaTags(baseHtml, {
      title: "Test Article – רוח חכמה",
      description: "Test description",
      ogTitle: "Test Article",
      ogDescription: "Test description",
      ogImage: "https://example.com/image.jpg",
      ogUrl: "https://ruachwisdom.org/article/test",
      ogType: "article",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org/article/test",
    });

    expect(result).toContain("<title>Test Article – רוח חכמה</title>");
    expect(result).toContain('content="Test description"');
    expect(result).toContain('content="Test Article"');
    expect(result).toContain('content="https://example.com/image.jpg"');
    expect(result).toContain('href="https://ruachwisdom.org/article/test"');
    // Markers should still be present
    expect(result).toContain("<!-- SEO_HEAD_START -->");
    expect(result).toContain("<!-- SEO_HEAD_END -->");
  });

  it("preserves non-SEO head elements", () => {
    const result = injectMetaTags(baseHtml, {
      title: "New Title",
      description: "New desc",
      ogTitle: "OG Title",
      ogDescription: "OG Desc",
      ogUrl: "https://ruachwisdom.org",
      ogType: "website",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org",
    });

    expect(result).toContain('href="/favicon.png"');
    expect(result).toContain('charset="UTF-8"');
    expect(result).toContain("fonts.googleapis.com");
  });

  it("escapes HTML in meta values", () => {
    const result = injectMetaTags(baseHtml, {
      title: 'Article with "quotes" & <tags>',
      description: 'Desc with "quotes" & <tags>',
      ogTitle: 'OG "quotes" & <tags>',
      ogDescription: 'OG "quotes"',
      ogUrl: "https://ruachwisdom.org/article/test",
      ogType: "article",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org/article/test",
    });

    // Should NOT contain raw unescaped characters in tag content
    expect(result).not.toMatch(/<title>.*<tags>.*<\/title>/);
    // The title tag should properly escape
    expect(result).toContain("\x26lt;");
    expect(result).toContain("\x26quot;");
  });

  it("includes og:image when provided", () => {
    const result = injectMetaTags(baseHtml, {
      title: "Test",
      description: "Test",
      ogTitle: "Test",
      ogDescription: "Test",
      ogImage: "https://ruachwisdom.org/cover.jpg",
      ogUrl: "https://ruachwisdom.org/article/test",
      ogType: "article",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org/article/test",
    });

    expect(result).toContain('property="og:image"');
    expect(result).toContain("cover.jpg");
  });

  describe("toAbsoluteImageUrl", () => {
    it("prefixes relative upload paths with the production origin", () => {
      expect(toAbsoluteImageUrl("/uploads/attachments/abc.jpg")).toBe(
        `${SITE_URL_PRODUCTION}/uploads/attachments/abc.jpg`
      );
    });

    it("adds a missing leading slash", () => {
      expect(toAbsoluteImageUrl("uploads/abc.jpg")).toBe(
        `${SITE_URL_PRODUCTION}/uploads/abc.jpg`
      );
    });

    it("passes absolute http(s) URLs through unchanged", () => {
      expect(toAbsoluteImageUrl("https://cdn.example.com/abc.jpg")).toBe(
        "https://cdn.example.com/abc.jpg"
      );
    });

    it("returns undefined for empty values", () => {
      expect(toAbsoluteImageUrl(null)).toBeUndefined();
      expect(toAbsoluteImageUrl(undefined)).toBeUndefined();
      expect(toAbsoluteImageUrl("")).toBeUndefined();
    });
  });

  it("always emits og:site_name", () => {
    const result = injectMetaTags(baseHtml, {
      title: "Test",
      description: "Test",
      ogTitle: "Test",
      ogDescription: "Test",
      ogUrl: "https://ruachwisdom.org",
      ogType: "website",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org",
    });
    expect(result).toContain('property="og:site_name"');
    expect(result).not.toContain('property="article:');
  });

  it("emits article:* meta and image:alt for articles, skipping absent fields", () => {
    const result = injectMetaTags(baseHtml, {
      title: "Test",
      description: "Test",
      ogTitle: "Test",
      ogDescription: "Test",
      ogImage: "https://ruachwisdom.org/cover.jpg",
      ogImageAlt: "כותרת המאמר",
      ogUrl: "https://ruachwisdom.org/article/test",
      ogType: "article",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org/article/test",
      articleMeta: {
        publishedTime: "2026-01-01T00:00:00.000Z",
        author: "יוסף כהן",
        section: "רמב\"ם",
      },
    });
    expect(result).toContain('property="article:published_time" content="2026-01-01T00:00:00.000Z"');
    expect(result).toContain('property="article:author"');
    expect(result).toContain('property="article:section"');
    expect(result).toContain('property="og:image:alt"');
    expect(result).toContain('name="twitter:image:alt"');
    // modifiedTime was not supplied → no tag
    expect(result).not.toContain('property="article:modified_time"');
  });

  it("emits JSON-LD script tags from the jsonLd payload", () => {
    const result = injectMetaTags(baseHtml, {
      title: "Test",
      description: "Test",
      ogTitle: "Test",
      ogDescription: "Test",
      ogUrl: "https://ruachwisdom.org",
      ogType: "website",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org",
      jsonLd: [{ "@type": "WebSite" }, { "@type": "Organization" }],
    });

    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain('"@type":"WebSite"');
    expect(result).toContain('"@type":"Organization"');
  });

  it("escapes </script> inside JSON-LD to prevent breakout", () => {
    const result = injectMetaTags(baseHtml, {
      title: "Test",
      description: "Test",
      ogTitle: "Test",
      ogDescription: "Test",
      ogUrl: "https://ruachwisdom.org",
      ogType: "website",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org",
      jsonLd: { name: "</script><img src=x>" },
    });

    expect(result).not.toContain("</script><img");
    expect(result).toContain("\\u003c/script");
  });

  it("omits og:image when not provided", () => {
    const result = injectMetaTags(baseHtml, {
      title: "Test",
      description: "Test",
      ogTitle: "Test",
      ogDescription: "Test",
      ogUrl: "https://ruachwisdom.org",
      ogType: "website",
      ogLocale: "he_IL",
      canonicalUrl: "https://ruachwisdom.org",
    });

    expect(result).not.toContain('property="og:image"');
  });

  describe("derech FAQPage (GEO)", () => {
    it("stripMdLite unwraps bold and links", () => {
      expect(stripMdLite("קטע **מודגש** עם [קישור](/article/x) בפנים")).toBe(
        "קטע מודגש עם קישור בפנים",
      );
    });

    it("derechFaqItems mirrors the visible page content", () => {
      const items = derechFaqItems(DEFAULT_DERECH_CONTENT);
      expect(items.length).toBe(4);
      expect(items[0].question).toBe("מהי דרך הרוח?");
      // Answers are plain text — no markdown-lite artifacts survive.
      for (const it of items) {
        expect(it.answer).not.toMatch(/\*\*|\]\(/);
      }
      // The principles answer enumerates all five, title + law.
      const principles = items.find((i) => i.question.includes("העקרונות"));
      expect(principles?.answer).toContain("1. התפתחות, לא השגה");
      expect(principles?.answer).toContain("5. החוש להרמוניה");
    });

    it("resolveDerechSeo builds FAQ from DB content when present", async () => {
      const custom = {
        ...DEFAULT_DERECH_CONTENT,
        opening: ["פתיח מותאם מה-DB", ""],
      };
      vi.mocked(getDerechContent).mockResolvedValue(custom as any);

      const seo = await resolveDerechSeo();
      const lds = seo.jsonLd as object[];
      expect(seo.canonicalUrl).toBe(`${SITE_URL_PRODUCTION}/derech`);
      const faq = lds.find((ld: any) => ld["@type"] === "FAQPage") as any;
      expect(faq).toBeDefined();
      expect(faq.mainEntity[0].acceptedAnswer.text).toBe("פתיח מותאם מה-DB");
    });

    it("resolveDerechSeo falls back to the default content on DB failure", async () => {
      vi.mocked(getDerechContent).mockRejectedValue(new Error("db down"));

      const seo = await resolveDerechSeo();
      const lds = seo.jsonLd as object[];
      const faq = lds.find((ld: any) => ld["@type"] === "FAQPage") as any;
      expect(faq.mainEntity.length).toBe(4);
      expect(faq.mainEntity[0].name).toBe("מהי דרך הרוח?");
    });
  });
});
describe("static route SEO — /tarot", () => {
  it("seoMiddleware resolves a head for /tarot and applySeoToHtml injects it", async () => {
    const { seoMiddleware, applySeoToHtml } = await import("./seo");
    const req = { method: "GET", path: "/tarot" } as any;
    await seoMiddleware(req, {} as any, () => {});
    const html = applySeoToHtml(
      `<!doctype html><html><head><!-- SEO_HEAD_START --><title>x</title><!-- SEO_HEAD_END --></head><body></body></html>`,
      req,
    );
    expect(html).toContain("קריאת טארוט אונליין חינם");
    expect(html).toContain(`${SITE_URL_PRODUCTION}/tarot`);
    expect(html).toContain('og:type" content="website"');
  });
});

describe("static route SEO — /tarot/deck", () => {
  it("seoMiddleware resolves a head for the deck gallery page", async () => {
    const { seoMiddleware, applySeoToHtml } = await import("./seo");
    const req = { method: "GET", path: "/tarot/deck" } as any;
    await seoMiddleware(req, {} as any, () => {});
    const html = applySeoToHtml(
      `<!doctype html><html><head><!-- SEO_HEAD_START --><title>x</title><!-- SEO_HEAD_END --></head><body></body></html>`,
      req,
    );
    expect(html).toContain("החפיסה המלאה — 78 קלפי הטארוט של רוח חכמה");
    expect(html).toContain(`${SITE_URL_PRODUCTION}/tarot/deck`);
  });
});

describe("static route SEO — /accessibility", () => {
  it("seoMiddleware resolves a head for the accessibility statement page", async () => {
    const { seoMiddleware, applySeoToHtml } = await import("./seo");
    const req = { method: "GET", path: "/accessibility" } as any;
    await seoMiddleware(req, {} as any, () => {});
    const html = applySeoToHtml(
      `<!doctype html><html><head><!-- SEO_HEAD_START --><title>x</title><!-- SEO_HEAD_END --></head><body></body></html>`,
      req,
    );
    expect(html).toContain("הצהרת נגישות | רוח חכמה");
    expect(html).toContain(`${SITE_URL_PRODUCTION}/accessibility`);
  });
});

describe("tarot card page SEO — /tarot/card/<slug>", () => {
  it("builds a search-targeted head from the DB summary + card image", async () => {
    const { resolveTarotCardSeo } = await import("./seo");
    const { getCardText } = await import("./db/tarot");
    vi.mocked(getCardText).mockResolvedValue({
      cardId: "major-00",
      name: "",
      summary: "התחלה חדשה, תמימות",
      interpretation: "<p>...</p>",
    } as any);

    const seo = await resolveTarotCardSeo("the-fool");
    expect(seo).not.toBeNull();
    expect(seo!.title).toBe("השוטה — פירוש הקלף בטארוט | רוח חכמה");
    expect(seo!.description).toContain("התחלה חדשה");
    expect(seo!.description).toContain("The Fool");
    expect(seo!.canonicalUrl).toBe(`${SITE_URL_PRODUCTION}/tarot/card/the-fool`);
    expect(seo!.ogImage).toContain("/tarot-cards/major-00.webp");
    const lds = seo!.jsonLd as object[];
    expect(JSON.stringify(lds)).toContain("BreadcrumbList");
  });

  it("falls back to a generic description when the DB is empty, and honors name overrides", async () => {
    const { resolveTarotCardSeo } = await import("./seo");
    const { getCardText } = await import("./db/tarot");
    vi.mocked(getCardText).mockResolvedValue(undefined as any);
    const seo = await resolveTarotCardSeo("ace-of-cups");
    expect(seo!.title).toContain("אס הגביעים");
    expect(seo!.description).toContain("Ace of Cups");
  });

  it("returns null for an unknown slug (SPA 404)", async () => {
    const { resolveTarotCardSeo } = await import("./seo");
    expect(await resolveTarotCardSeo("not-a-card")).toBeNull();
  });

  it("seoMiddleware routes /tarot/card/<slug> to the card resolver", async () => {
    const { seoMiddleware, applySeoToHtml } = await import("./seo");
    const { getCardText } = await import("./db/tarot");
    vi.mocked(getCardText).mockResolvedValue(undefined as any);
    const req = { method: "GET", path: "/tarot/card/the-tower" } as any;
    await seoMiddleware(req, {} as any, () => {});
    const html = applySeoToHtml(
      `<!doctype html><html><head><!-- SEO_HEAD_START --><title>x</title><!-- SEO_HEAD_END --></head><body></body></html>`,
      req,
    );
    expect(html).toContain("המגדל — פירוש הקלף בטארוט");
    expect(html).toContain(`${SITE_URL_PRODUCTION}/tarot/card/the-tower`);
  });
});

describe("static route SEO — /tarot/guide (pillar)", () => {
  it("serves the guide head with FAQPage JSON-LD mirroring the shared FAQ", async () => {
    const { seoMiddleware, applySeoToHtml } = await import("./seo");
    const req = { method: "GET", path: "/tarot/guide" } as any;
    await seoMiddleware(req, {} as any, () => {});
    const html = applySeoToHtml(
      `<!doctype html><html><head><!-- SEO_HEAD_START --><title>x</title><!-- SEO_HEAD_END --></head><body></body></html>`,
      req,
    );
    expect(html).toContain("המדריך לקלפי הטארוט");
    expect(html).toContain(`${SITE_URL_PRODUCTION}/tarot/guide`);
    expect(html).toContain("FAQPage");
    expect(html).toContain("האם הטארוט מגיד עתידות?");
  });
});
