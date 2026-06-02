import { type Request, type Response } from "express";
import { getArticles, getCategories } from "./db";
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
 * Includes: home page, about, contact, all categories, all published articles.
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

  // ── Category pages ──
  try {
    const cats = await getCategories();
    for (const cat of cats) {
      entries.push({
        loc: `${baseUrl}/category/${encodeURIComponent(cat.slug)}`,
        changefreq: "weekly",
        priority: 0.7,
      });
    }
  } catch (err) {
    console.warn("[Sitemap] Error fetching categories:", err);
  }

  // ── Article pages ──
  try {
    const articles = await getArticles({ published: true });
    for (const article of articles) {
      entries.push({
        loc: `${baseUrl}/article/${encodeURIComponent(article.slug)}`,
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