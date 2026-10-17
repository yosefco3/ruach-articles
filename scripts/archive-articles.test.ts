import { describe, it, expect } from "vitest";
import {
  absoluteAssetUrl, assetFileName, collectImageUrls, rewriteAssetRefs, renderRetiredModule, buildArchiveReadme,
} from "./archive-articles";

const BASE = "https://ruachwisdom.org";

describe("archive-articles helpers", () => {
  it("absoluteAssetUrl keeps R2 urls and prefixes site-relative uploads", () => {
    expect(absoluteAssetUrl("https://x.r2.dev/a.jpg", BASE)).toBe("https://x.r2.dev/a.jpg");
    expect(absoluteAssetUrl("/uploads/a.jpg", BASE)).toBe("https://ruachwisdom.org/uploads/a.jpg");
  });

  it("assetFileName is stable, safe and distinguishes same-named files from different urls", () => {
    const a = assetFileName("https://x.r2.dev/covers/שער%20א.jpg?v=1");
    const b = assetFileName("https://y.r2.dev/other/שער%20א.jpg");
    expect(a).toMatch(/^שער_א-[0-9a-f]{1,6}\.jpg$/);
    expect(a).not.toBe(b);
    expect(assetFileName("https://x.r2.dev/covers/שער%20א.jpg?v=1")).toBe(a);
  });

  it("collectImageUrls: cover first, inline imgs, dedup, skips data: urls", () => {
    const html = `<p><img src="/uploads/one.png"><img src="https://x.r2.dev/two.webp"><img src="/uploads/one.png"><img src="data:image/png;base64,AAA"></p>`;
    expect(collectImageUrls(html, "https://x.r2.dev/cover.jpg", BASE)).toEqual([
      "https://x.r2.dev/cover.jpg",
      "https://ruachwisdom.org/uploads/one.png",
      "https://x.r2.dev/two.webp",
    ]);
  });

  it("rewriteAssetRefs replaces absolute and site-relative references", () => {
    const m = new Map([["https://ruachwisdom.org/uploads/one.png", "../images/one-abc.png"]]);
    expect(rewriteAssetRefs(`<img src="/uploads/one.png"> and https://ruachwisdom.org/uploads/one.png`, m, BASE))
      .toBe(`<img src="../images/one-abc.png"> and ../images/one-abc.png`);
  });

  it("renderRetiredModule emits a sorted, deduplicated set with the redirect target", () => {
    const src = renderRetiredModule(["b", "a", "b"], "2026-10-17");
    expect(src).toContain('export const RETIRED_ARTICLE_TARGET = "/derech";');
    expect(src.indexOf('"a"')).toBeLessThan(src.indexOf('"b"'));
    expect((src.match(/"b"/g) ?? []).length).toBe(1);
    expect(src).toContain("export function isRetiredArticle");
  });

  it("buildArchiveReadme groups by category and links encoded slugs", () => {
    const md = buildArchiveReadme([
      { id: 1, title: "א", slug: "a b", excerpt: null, category: "רמחל", tags: "", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    ], "2026-10-17", BASE);
    expect(md).toContain("## רמחל");
    expect(md).toContain("[א](articles/a%20b.md)");
  });
});
