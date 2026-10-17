import { SITE_URL_PRODUCTION, SITE_NAME, AUTHOR_NAME } from "@shared/const";

// ─── schema.org JSON-LD builders ─────────────────────────────────────────────
//
// Pure builders that return plain objects; server/seo.ts serialises them into
// <script type="application/ld+json"> tags inside the SSR <head>. Structured data
// lets Google build rich results (article cards, breadcrumbs) and a brand entity
// (Organization + WebSite) around the site brand and the author's pen name (shared/const).

const ORG_NAME = SITE_NAME;
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
    founder: { "@type": "Person", name: AUTHOR_NAME },
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
    author: { "@type": "Person", name: a.authorName || AUTHOR_NAME },
    publisher: organizationLd(),
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    inLanguage: "he-IL",
  };
}

export interface BookLdInput {
  title: string;
  url: string;
  description: string;
  image?: string;
  authorName?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  /** קישורי רכישה — רק כשהספר זמין; נהפכים ל-offers. */
  offers?: { url: string; label: string }[];
}

/** schema.org Book — דף ספר (site-pivot-books). offers מופיעים רק כשיש קישורי רכישה. */
export function bookLd(b: BookLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: b.title,
    description: b.description,
    url: b.url,
    mainEntityOfPage: b.url,
    ...(b.image ? { image: b.image } : {}),
    author: { "@type": "Person", name: b.authorName || AUTHOR_NAME },
    ...(b.isbn ? { isbn: b.isbn } : {}),
    ...(b.publisher ? { publisher: { "@type": "Organization", name: b.publisher } } : {}),
    inLanguage: "he-IL",
    ...(b.offers && b.offers.length > 0
      ? {
          offers: b.offers.map((o) => ({
            "@type": "Offer",
            url: o.url,
            name: o.label,
            availability: "https://schema.org/InStock",
          })),
        }
      : {}),
  };
}

export interface PersonLdInput {
  name: string;
  url: string;
  description?: string;
  image?: string;
  jobTitle?: string;
  sameAs?: string[];
}

/** schema.org Person — דף מורה (site-pivot-books). */
export function personLd(p: PersonLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    url: p.url,
    mainEntityOfPage: p.url,
    ...(p.description ? { description: p.description } : {}),
    ...(p.image ? { image: p.image } : {}),
    ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}),
    ...(p.sameAs && p.sameAs.length ? { sameAs: p.sameAs } : {}),
    affiliation: organizationLd(),
  };
}

export interface EventLdInput {
  name: string;
  url: string;
  description?: string;
  image?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  registrationUrl?: string;
  price?: string;
}

/** schema.org Event — דף אירוע (site-pivot-books). */
export function eventLd(e: EventLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    url: e.url,
    ...(e.description ? { description: e.description } : {}),
    ...(e.image ? { image: e.image } : {}),
    startDate: e.startDate,
    ...(e.endDate ? { endDate: e.endDate } : {}),
    eventAttendanceMode: e.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: e.isOnline
      ? { "@type": "VirtualLocation", url: e.registrationUrl || e.url }
      : { "@type": "Place", name: e.location || SITE_NAME, address: e.location || "" },
    organizer: organizationLd(),
    ...(e.registrationUrl ? { offers: { "@type": "Offer", url: e.registrationUrl, ...(e.price ? { description: e.price } : {}) } } : {}),
    inLanguage: "he-IL",
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQPage — the schema AI engines (ChatGPT, Perplexity, Gemini) extract and
 * cite most readily. Per Google policy the Q&A must mirror content actually
 * visible on the page — callers derive items from the rendered content.
 */
export function faqPageLd(items: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
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
