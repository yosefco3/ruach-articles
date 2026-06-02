import type { Express } from "express";
import { seoMiddleware } from "../../seo";
import { serveSitemap } from "../../sitemap";
import { serveRobotsTxt } from "../../robots";

export function mountSeoRoutes(app: Express): void {
  // SEO: Sitemap and robots.txt
  app.get("/sitemap.xml", serveSitemap);
  app.get("/robots.txt", serveRobotsTxt);

  // SEO middleware — resolves article/category meta data before serving HTML
  app.use(seoMiddleware);
}