import { type Request, type Response } from "express";
import { getArticles, listBooks, listTeachers } from "./db";
import { articlePath } from "@shared/articleUrl";
import { CARDS, cardSlug } from "@shared/tarot";
import { SITE_URL_PRODUCTION } from "@shared/const";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "\x26amp;")
    .replace(/"/g, "\x26quot;")
    .replace(/'/g, "\x26apos;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;");
}

function buildUrlElement(entry: SitemapEntry): string {
  let xml = "  <url>\n";
  xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
  if (entry.lastmod) {
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
  }
  if (entry.changefreq) {
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
  }
  if (entry.priority !== undefined) {
    xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
  }
  xml += "  </url>\n";
  return xml;
}

function toIsoDate(date: Date | string | null): string | undefined {
  if (!date) return undefined;
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  } catch {
    return undefined;
  }
}

/**
 * Generates and serves a dynamic sitemap.xml from the database.
 * Includes: static pages, tarot cards, visible books + teachers, published articles (chapters under their book).
 */
export async function serveSitemap(req: Request, res: Response): Promise<void> {
  const baseUrl = SITE_URL_PRODUCTION;

  const entries: SitemapEntry[] = [];

  // ── Static pages ──
  entries.push({
    loc: baseUrl,
    changefreq: "daily",
    priority: 1.0,
  });
  entries.push({
    loc: `${baseUrl}/about`,
    changefreq: "monthly",
    priority: 0.5,
  });
  entries.push({
    loc: `${baseUrl}/contact`,
    changefreq: "monthly",
    priority: 0.5,
  });
  entries.push({
    loc: `${baseUrl}/iching`,
    changefreq: "monthly",
    priority: 0.9, // flagship interactive feature
  });
  entries.push({
    loc: `${baseUrl}/tarot`,
    changefreq: "monthly",
    priority: 0.9, // flagship interactive feature
  });
  entries.push({
    loc: `${baseUrl}/tarot/deck`,
    changefreq: "monthly",
    priority: 0.7, // the full-deck gallery
  });

  entries.push({
    loc: `${baseUrl}/tarot/guide`,
    changefreq: "monthly",
    priority: 0.8, // the pillar guide article
  });

  // ── Tarot card pages — 78 SEO landing pages ──
  for (const card of CARDS) {
    entries.push({
      loc: `${baseUrl}/tarot/card/${cardSlug(card)}`,
      changefreq: "monthly",
      priority: 0.6,
    });
  }
  entries.push({
    loc: `${baseUrl}/derech`,
    changefreq: "monthly",
    priority: 0.8, // the method page — the site's brand
  });
  entries.push({
    loc: `${baseUrl}/accessibility`,
    changefreq: "yearly",
    priority: 0.3, // accessibility statement
  });

  entries.push({ loc: `${baseUrl}/books`, changefreq: "weekly", priority: 0.8 });
  entries.push({ loc: `${baseUrl}/teachers`, changefreq: "weekly", priority: 0.7 });

  // ── Books (visible only) ──
  try {
    const books = await listBooks({ visibleOnly: true });
    for (const b of books) {
      entries.push({
        loc: `${baseUrl}/book/${encodeURIComponent(b.slug)}`,
        lastmod: toIsoDate(b.updatedAt || b.createdAt),
        changefreq: "weekly",
        priority: 0.9,
      });
    }
  } catch (err) {
    console.warn("[Sitemap] Error fetching books:", err);
  }

  // ── Teachers (visible only) ──
  try {
    const teachers = await listTeachers({ visibleOnly: true });
    for (const t of teachers) {
      entries.push({
        loc: `${baseUrl}/teacher/${encodeURIComponent(t.slug)}`,
        lastmod: toIsoDate(t.updatedAt || t.createdAt),
        changefreq: "monthly",
        priority: 0.7,
      });
    }
  } catch (err) {
    console.warn("[Sitemap] Error fetching teachers:", err);
  }

  // ── Articles: sample chapters / materials under their (visible) book, teacher articles at /article ──
  try {
    const articles = await getArticles({ published: true });
    for (const article of articles) {
      const path = articlePath(article);
      if (!path) continue;
      entries.push({
        loc: `${baseUrl}${path}`,
        lastmod: toIsoDate(article.updatedAt || article.createdAt),
        changefreq: "weekly",
        priority: 0.8,
      });
    }
  } catch (err) {
    console.warn("[Sitemap] Error fetching articles:", err);
  }

  // ── Build XML ──
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const entry of entries) {
    xml += buildUrlElement(entry);
  }
  xml += "</urlset>\n";

  res
    .status(200)
    .set({
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    })
    .send(xml);
}