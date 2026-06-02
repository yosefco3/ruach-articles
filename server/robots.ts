import { type Request, type Response } from "express";
import { SITE_URL_PRODUCTION } from "@shared/const";

/**
 * Serves a static robots.txt file.
 * Allows all crawlers, points to the sitemap.
 */
export function serveRobotsTxt(req: Request, res: Response): void {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL_PRODUCTION}/sitemap.xml`,
  ];

  res
    .status(200)
    .set({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    })
    .send(lines.join("\n"));
}