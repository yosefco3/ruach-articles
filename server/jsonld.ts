import { SITE_URL_PRODUCTION } from "@shared/const";

// ─── schema.org JSON-LD builders ─────────────────────────────────────────────
//
// Pure builders that return plain objects; server/seo.ts serialises them into
// <script type="application/ld+json"> tags inside the SSR <head>. Structured data
// lets Google build rich results (article cards, breadcrumbs) and a brand entity
// (Organization + WebSite) around "רוח חכמה" / "יוסף כהן".

const ORG_NAME = "רוח חכמה";
const LOGO_URL = `${SITE_URL_PRODUCTION}/favicon.png`;

/**
 * Social profile URLs feed the Organization `sameAs` array (→ knowledge panel).
 * Empty for now — fill once handles exist; an empty array omits the key entirely.
 */
export const SOCIAL_PROFILES: string[] = [];

export function organizationLd(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL_PRODUCTION}/#organization`,
    name: ORG_NAME,
    url: SITE_URL_PRODUCTION,
    logo: LOGO_URL,
    founder: { "@type": "Person", name: "יוסף כהן" },
    ...(SOCIAL_PROFILES.length ? { sameAs: SOCIAL_PROFILES } : {}),
  };
}

export function webSiteLd(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL_PRODUCTION}/#website`,
    url: SITE_URL_PRODUCTION,
    name: ORG_NAME,
    inLanguage: "he-IL",
    publisher: { "@id": `${SITE_URL_PRODUCTION}/#organization` },
  };
}

/** Homepage / generic pages: a graph of Organization + WebSite. */
export function siteLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationLd(), webSiteLd()],
  };
}

export interface ArticleLdInput {
  title: string;
  url: string;
  description: string;
  image?: string;
  authorName?: string | null;
  datePublished?: string;
  dateModified?: string;
}

export function articleLd(a: ArticleLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    mainEntityOfPage: a.url,
    ...(a.image ? { image: a.image } : {}),
    author: { "@type": "Person", name: a.authorName || "יוסף כהן" },
    publisher: organizationLd(),
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    inLanguage: "he-IL",
  };
}

export function breadcrumbLd(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * Serialise a JSON-LD object for embedding in a <script> tag. Escapes `<` so a
 * value containing "</script>" cannot break out of the script element. Do NOT run
 * the result through HTML-attribute escaping — this is script *content*, not an
 * attribute, and entity-escaping would corrupt the JSON.
 */
export function jsonLdToScript(ld: unknown): string {
  return JSON.stringify(ld).replace(/</g, "\\u003c");
}
