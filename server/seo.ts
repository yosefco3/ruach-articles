import { type Request, type Response, type NextFunction } from "express";
import { getArticleBySlug, getArticles, getCategoryBySlug } from "./db";
import { SITE_URL_PRODUCTION } from "@shared/const";
import { siteLd, articleLd, breadcrumbLd, jsonLdToScript } from "./jsonld";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SeoData {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  ogUrl: string;
  ogType: string;
  ogLocale: string;
  canonicalUrl: string;
  jsonLd?: object | object[];
  ogImageAlt?: string;
  articleMeta?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
}

const SITE_NAME = "רוח חכמה";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * OG crawlers (WhatsApp, Facebook, Twitter…) require absolute image URLs.
 * Locally-stored covers come back as relative paths (e.g. "/uploads/…"), so
 * prefix them with the production origin; absolute (R2/CDN) URLs pass through.
 */
export function toAbsoluteImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL_PRODUCTION}${url.startsWith("/") ? "" : "/"}${url}`;
}

// ─── Default SEO (fallback) ─────────────────────────────────────────────────

const DEFAULT_SEO: SeoData = {
  title: "רוח חכמה – מאמרים ברוחניות, פילוסופיה וריפוי",
  description: "האתר של יוסף כהן - פלטפורמה למאמרים בנושאי יהדות, פילוסופיה, רוחניות וריפוי. קריאה ממוחשבת באי צ'ינג.",
  ogTitle: "רוח חכמה – מאמרים ברוחניות, פילוסופיה וריפוי",
  ogDescription: "האתר של יוסף כהן - פלטפורמה למאמרים בנושאי יהדות, פילוסופיה, רוחניות וריפוי. קריאה ממוחשבת באי צ'ינג.",
  ogImage: `${SITE_URL_PRODUCTION}/og-image.jpg`,
  ogUrl: SITE_URL_PRODUCTION,
  ogType: "website",
  ogLocale: "he_IL",
  canonicalUrl: SITE_URL_PRODUCTION,
  jsonLd: siteLd(),
};

// ─── HTML Injection ─────────────────────────────────────────────────────────

function buildSeoTags(data: SeoData): string {
  const tags: string[] = [
    `<title>${escapeHtml(data.title)}</title>`,
    `<meta name="description" content="${escapeHtml(data.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(data.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(data.ogDescription)}" />`,
    `<meta property="og:url" content="${escapeHtml(data.ogUrl)}" />`,
    `<meta property="og:type" content="${escapeHtml(data.ogType)}" />`,
    `<meta property="og:locale" content="${escapeHtml(data.ogLocale)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<link rel="canonical" href="${escapeHtml(data.canonicalUrl)}" />`,
  ];

  if (data.ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(data.ogImage)}" />`);
    if (data.ogImageAlt) {
      tags.push(`<meta property="og:image:alt" content="${escapeHtml(data.ogImageAlt)}" />`);
    }
  }

  // article:* Open Graph properties — only the ones we actually have.
  if (data.articleMeta) {
    const m = data.articleMeta;
    if (m.publishedTime)
      tags.push(`<meta property="article:published_time" content="${escapeHtml(m.publishedTime)}" />`);
    if (m.modifiedTime)
      tags.push(`<meta property="article:modified_time" content="${escapeHtml(m.modifiedTime)}" />`);
    if (m.author)
      tags.push(`<meta property="article:author" content="${escapeHtml(m.author)}" />`);
    if (m.section)
      tags.push(`<meta property="article:section" content="${escapeHtml(m.section)}" />`);
  }

  // Twitter / X card — mirrors the OG tags so shared links render a rich preview.
  tags.push(
    `<meta name="twitter:card" content="${data.ogImage ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(data.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(data.ogDescription)}" />`,
  );
  if (data.ogImage) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(data.ogImage)}" />`);
    if (data.ogImageAlt) {
      tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(data.ogImageAlt)}" />`);
    }
  }

  // Structured data (schema.org) — one <script> per payload.
  const lds = Array.isArray(data.jsonLd) ? data.jsonLd : data.jsonLd ? [data.jsonLd] : [];
  for (const ld of lds) {
    tags.push(`<script type="application/ld+json">${jsonLdToScript(ld)}</script>`);
  }

  return `    <!-- SEO_HEAD_START -->\n${tags.join("\n")}\n    <!-- SEO_HEAD_END -->`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "\x26amp;")
    .replace(/"/g, "\x26quot;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;");
}

export function injectMetaTags(html: string, seo: SeoData): string {
  const seoBlock = buildSeoTags(seo);
  // Replace everything between the markers (inclusive)
  return html.replace(
    /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/,
    seoBlock
  );
}

// ─── Static per-route SEO ───────────────────────────────────────────────────

const ICHING_SEO: SeoData = {
  title: "קריאת אי צ׳ינג — רוּחַ",
  description:
    "הטל מטבעות וקבל קריאת אי-צ'ינג חיה בעברית — סֵפֶר הַתְּמוּרוֹת, פרשנות מעמיקה לכל הקסגרמה וקו משתנה.",
  ogTitle: "קריאת אי צ׳ינג — רוּחַ",
  ogDescription:
    "הטל מטבעות וקבל קריאת אי-צ'ינג חיה בעברית — סֵפֶר הַתְּמוּרוֹת.",
  ogUrl: `${SITE_URL_PRODUCTION}/iching`,
  ogType: "website",
  ogLocale: "he_IL",
  canonicalUrl: `${SITE_URL_PRODUCTION}/iching`,
  jsonLd: siteLd(),
};

const STATIC_ROUTE_SEO: Record<string, SeoData> = {
  "/iching": ICHING_SEO,
};

// ─── Route Matchers ─────────────────────────────────────────────────────────

function matchArticleSlug(pathname: string): string | null {
  const match = pathname.match(/^\/article\/([^/]+)$/);
  return match ? match[1] : null;
}

function matchCategorySlug(pathname: string): string | null {
  const match = pathname.match(/^\/category\/([^/]+)$/);
  return match ? match[1] : null;
}

// ─── SEO Data Resolvers ─────────────────────────────────────────────────────

async function resolveArticleSeo(slug: string): Promise<SeoData | null> {
  const article = await getArticleBySlug(slug);
  if (!article || !article.published) return null;

  const articleUrl = `${SITE_URL_PRODUCTION}/article/${article.slug}`;
  const title = `${article.title} – רוח חכמה`;
  const description = article.excerpt || `מאמר מאת ${article.authorName || "יוסף כהן"} בנושא ${article.category}`;
  const image = toAbsoluteImageUrl(article.coverImage);

  // Human-readable category name for the breadcrumb (article.category is a slug).
  const category = await getCategoryBySlug(article.category).catch(() => null);
  const categoryName = category?.name || article.category;
  const categoryUrl = `${SITE_URL_PRODUCTION}/category/${encodeURIComponent(article.category)}`;

  return {
    title,
    description,
    ogTitle: article.title,
    ogDescription: description,
    ogImage: image,
    ogImageAlt: image ? article.title : undefined,
    ogUrl: articleUrl,
    ogType: "article",
    ogLocale: "he_IL",
    canonicalUrl: articleUrl,
    articleMeta: {
      publishedTime: toIsoDateTime(article.createdAt),
      modifiedTime: toIsoDateTime(article.updatedAt || article.createdAt),
      author: article.authorName || "יוסף כהן",
      section: categoryName,
    },
    jsonLd: [
      articleLd({
        title: article.title,
        url: articleUrl,
        description,
        image,
        authorName: article.authorName,
        datePublished: toIsoDateTime(article.createdAt),
        dateModified: toIsoDateTime(article.updatedAt || article.createdAt),
      }),
      breadcrumbLd([
        { name: "רוח חכמה", url: SITE_URL_PRODUCTION },
        { name: categoryName, url: categoryUrl },
        { name: article.title, url: articleUrl },
      ]),
    ],
  };
}

/** ISO-8601 timestamp for schema.org date fields; undefined if unparseable. */
function toIsoDateTime(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  const d = typeof date === "string" ? new Date(date) : date;
  const t = d.getTime();
  return Number.isNaN(t) ? undefined : d.toISOString();
}

async function resolveCategorySeo(slug: string): Promise<SeoData | null> {
  const category = await getCategoryBySlug(slug);

  // Also check if there are published articles in this category
  const articles = await getArticles({ category: slug, published: true });
  if (articles.length === 0) return null;

  const categoryUrl = `${SITE_URL_PRODUCTION}/category/${slug}`;
  const categoryName = category?.name || slug;
  const title = `${categoryName} – מאמרים – רוח חכמה`;
  const description = category?.description || `מאמרים בקטגוריית ${categoryName}`;

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: toAbsoluteImageUrl(articles[0]?.coverImage),
    ogUrl: categoryUrl,
    ogType: "website",
    ogLocale: "he_IL",
    canonicalUrl: categoryUrl,
  };
}

// ─── Middleware ──────────────────────────────────────────────────────────────

/**
 * SEO middleware — injects page-specific meta tags into index.html.
 * Only processes GET requests to public-facing routes.
 * Falls through silently if no SEO data is found (SPA handles 404).
 */
export async function seoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only process GET requests to non-API routes
  if (req.method !== "GET" || req.path.startsWith("/api/")) {
    return next();
  }

  const pathname = req.path;

  // Skip admin routes, static assets, etc.
  if (
    pathname.startsWith("/admin") ||
    pathname.includes(".") || // files with extensions (e.g. .js, .css)
    pathname.startsWith("/uploads")
  ) {
    return next();
  }

  let seo: SeoData | null = null;

  try {
    const articleSlug = matchArticleSlug(pathname);
    const categorySlug = matchCategorySlug(pathname);

    if (STATIC_ROUTE_SEO[pathname]) {
      seo = STATIC_ROUTE_SEO[pathname];
    } else if (articleSlug) {
      seo = await resolveArticleSeo(articleSlug);
    } else if (categorySlug) {
      seo = await resolveCategorySeo(categorySlug);
    }
    // Home, about, contact — fall back to DEFAULT_SEO below.
  } catch (err) {
    console.warn("[SEO] Error resolving SEO data:", err);
  }

  // Attach resolved SEO data to the request for downstream use
  (req as any).seoData = seo || DEFAULT_SEO;

  next();
}

/**
 * Takes raw HTML and injects the SEO data that was resolved by seoMiddleware.
 * Used by both dev (Vite) and production (static) serving flows.
 */
export function applySeoToHtml(html: string, req: Request): string {
  const seo: SeoData = (req as any).seoData || DEFAULT_SEO;
  return injectMetaTags(html, seo);
}