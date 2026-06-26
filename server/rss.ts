import { type Request, type Response } from "express";
import { getArticles } from "./db";
import { SITE_URL_PRODUCTION } from "@shared/const";

const FEED_TITLE = "רוח חכמה";
const FEED_DESCRIPTION =
  "האתר של יוסף כהן - פלטפורמה למאמרים בנושאי יהדות, פילוסופיה, רוחניות וריפוי. קריאה ממוחשבת באי צ'ינג.";
const MAX_ITEMS = 30;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date: Date | string | null | undefined): string {
  if (!date) return new Date(0).toUTCString();
  const d = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? new Date(0).toUTCString() : d.toUTCString();
}

/**
 * Serves an RSS 2.0 feed of the latest published articles so readers can
 * subscribe and aggregators discover new posts quickly. Mirrors serveSitemap.
 */
export async function serveRss(_req: Request, res: Response): Promise<void> {
  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles({ published: true });
  } catch (err) {
    console.warn("[RSS] Error fetching articles:", err);
  }

  // getArticles already orders by sortOrder then createdAt desc; take the latest.
  const items = articles.slice(0, MAX_ITEMS);

  const itemXml = items
    .map((a) => {
      const url = `${SITE_URL_PRODUCTION}/article/${encodeURIComponent(a.slug)}`;
      const desc = a.excerpt || "";
      return [
        "    <item>",
        `      <title>${escapeXml(a.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${toRfc822(a.createdAt)}</pubDate>`,
        a.category ? `      <category>${escapeXml(a.category)}</category>` : "",
        a.authorName ? `      <dc:creator>${escapeXml(a.authorName)}</dc:creator>` : "",
        `      <description><![CDATA[${desc}]]></description>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
    `  <channel>\n` +
    `    <title>${escapeXml(FEED_TITLE)}</title>\n` +
    `    <link>${SITE_URL_PRODUCTION}</link>\n` +
    `    <description>${escapeXml(FEED_DESCRIPTION)}</description>\n` +
    `    <language>he-il</language>\n` +
    `    <atom:link href="${SITE_URL_PRODUCTION}/rss.xml" rel="self" type="application/rss+xml" />\n` +
    `${itemXml}\n` +
    `  </channel>\n` +
    `</rss>\n`;

  res
    .status(200)
    .set({
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    })
    .send(xml);
}
