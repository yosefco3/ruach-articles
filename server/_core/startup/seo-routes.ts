import type { Express } from "express";
import { seoMiddleware } from "../../seo";
import { serveSitemap } from "../../sitemap";
import { serveRobotsTxt } from "../../robots";
import { serveRss } from "../../rss";
import { serveLlmsTxt } from "../../llmstxt";
import { DECK_ZIP_ROUTE, DECK_ZIP_ROUTE_EN, serveDeckZip, serveDeckZipEn } from "../../tarotDeckZip";

export function mountSeoRoutes(app: Express): void {
  // SEO: Sitemap, robots.txt, RSS feed, llms.txt (AI-readable index)
  app.get("/sitemap.xml", serveSitemap);
  app.get("/robots.txt", serveRobotsTxt);
  app.get("/rss.xml", serveRss);
  app.get("/llms.txt", serveLlmsTxt);

  // חפיסת הטארוט להורדה חופשית (ZIP נבנה בעצלנות מהנכסים הפרוסים)
  app.get(DECK_ZIP_ROUTE, serveDeckZip);
  app.get(DECK_ZIP_ROUTE_EN, serveDeckZipEn); // אותה חפיסה עם שמות באנגלית (en/)

  // SEO middleware — resolves article/category meta data before serving HTML
  app.use(seoMiddleware);
}