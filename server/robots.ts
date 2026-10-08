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
    // Cloudflare rewrites e-mail addresses into /cdn-cgi/l/email-protection links;
    // crawlers that follow them get a 404 (seen in Search Console). Cloudflare's own
    // guidance is to disallow the whole /cdn-cgi/ namespace.
    "Disallow: /cdn-cgi/",
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