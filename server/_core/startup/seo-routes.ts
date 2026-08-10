import type { Express } from "express";
import { seoMiddleware } from "../../seo";
import { serveSitemap } from "../../sitemap";
import { serveRobotsTxt } from "../../robots";
import { serveRss } from "../../rss";
import { serveLlmsTxt } from "../../llmstxt";

export function mountSeoRoutes(app: Express): void {
  // SEO: Sitemap, robots.txt, RSS feed, llms.txt (AI-readable index)
  app.get("/sitemap.xml", serveSitemap);
  app.get("/robots.txt", serveRobotsTxt);
  app.get("/rss.xml", serveRss);
  app.get("/llms.txt", serveLlmsTxt);

  // SEO middleware — resolves article/category meta data before serving HTML
  app.use(seoMiddleware);
}