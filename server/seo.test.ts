import { describe, it, expect, vi } from "vitest";

// Mock the db module to prevent env validation chain
vi.mock("./db", () => ({
  getArticleBySlug: vi.fn(),
  getArticles: vi.fn(),
  getCategoryBySlug: vi.fn(),
}));

import { injectMetaTags, toAbsoluteImageUrl } from "./seo";
import { SITE_URL_PRODUCTION } from "@shared/const";

describe("SEO Meta Injection", () => {
  const baseHtml = `<!doctype html>
<html lang="he" dir="rtl">
<head>
    <link rel="icon" type="image/png" href="./favicon.png">
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

    expect(result).toContain('href="./favicon.png"');
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
});