import { describe, it, expect } from "vitest";
import {
  organizationLd,
  webSiteLd,
  siteLd,
  articleLd,
  breadcrumbLd,
  jsonLdToScript,
} from "./jsonld";
import { SITE_URL_PRODUCTION } from "@shared/const";

describe("jsonld builders", () => {
  it("organizationLd carries id, name, url and logo", () => {
    const org = organizationLd();
    expect(org["@type"]).toBe("Organization");
    expect(org["@id"]).toBe(`${SITE_URL_PRODUCTION}/#organization`);
    expect(org.name).toBe("רוח חכמה");
    expect(org.logo).toBe(`${SITE_URL_PRODUCTION}/favicon.png`);
    // sameAs omitted while no social profiles are configured
    expect(org).not.toHaveProperty("sameAs");
  });

  it("webSiteLd references the organization as publisher", () => {
    const site = webSiteLd();
    expect(site["@type"]).toBe("WebSite");
    expect(site.publisher).toEqual({ "@id": `${SITE_URL_PRODUCTION}/#organization` });
    expect(site.inLanguage).toBe("he-IL");
  });

  it("siteLd is a graph of Organization + WebSite", () => {
    const g = siteLd() as { "@graph": Array<{ "@type": string }> };
    expect(g["@context"]).toBe("https://schema.org");
    expect(g["@graph"].map((n) => n["@type"])).toEqual(["Organization", "WebSite"]);
  });

  it("articleLd includes headline + publisher and omits absent optionals", () => {
    const a = articleLd({
      title: "כותרת",
      url: `${SITE_URL_PRODUCTION}/article/x`,
      description: "תיאור",
    });
    expect(a["@type"]).toBe("BlogPosting");
    expect(a.headline).toBe("כותרת");
    expect(a.author).toEqual({ "@type": "Person", name: "יוסף כהן" });
    expect(a.publisher).toMatchObject({ "@type": "Organization" });
    expect(a).not.toHaveProperty("image");
    expect(a).not.toHaveProperty("datePublished");
  });

  it("articleLd includes image + dates + explicit author when provided", () => {
    const a = articleLd({
      title: "t",
      url: "u",
      description: "d",
      image: "https://x/y.jpg",
      authorName: "דנה",
      datePublished: "2026-01-01T00:00:00.000Z",
      dateModified: "2026-02-01T00:00:00.000Z",
    });
    expect(a.image).toBe("https://x/y.jpg");
    expect(a.author).toEqual({ "@type": "Person", name: "דנה" });
    expect(a.datePublished).toBe("2026-01-01T00:00:00.000Z");
    expect(a.dateModified).toBe("2026-02-01T00:00:00.000Z");
  });

  it("breadcrumbLd numbers positions from 1", () => {
    const b = breadcrumbLd([
      { name: "בית", url: "https://x/" },
      { name: "קטגוריה", url: "https://x/c" },
    ]) as { itemListElement: Array<{ position: number; name: string }> };
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(b.itemListElement[0].name).toBe("בית");
  });

  it("jsonLdToScript escapes < to neutralise </script>", () => {
    const out = jsonLdToScript({ name: "</script>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script>");
  });
});
