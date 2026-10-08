import type { NextFunction, Request, Response } from "express";
import { SITE_DOMAIN, SITE_URL_PRODUCTION } from "@shared/const";

/**
 * One URL per page. Search Console listed www.ruachwisdom.org and trailing-slash
 * variants as "alternate page with proper canonical tag": the canonical tag said
 * which URL is real, but the server still served the duplicates with 200. A 301
 * is unambiguous and also moves any link equity the duplicates collected.
 */

export interface CanonicalInput {
  method: string;
  /** Raw Host header (may carry a port). */
  host: string | undefined;
  /** Path + query as received, e.g. "/tarot/?x=1". */
  originalUrl: string;
}

/** Paths that are not pages — never rewrite their shape. */
const EXEMPT_PREFIXES = ["/api/", "/uploads/", "/cdn-cgi/"];

/**
 * The URL to 301 to, or null when the request is already canonical.
 * Pure, so it is unit-tested without Express.
 */
export function canonicalRedirectTarget(input: CanonicalInput): string | null {
  const method = input.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return null;

  const host = (input.host ?? "").toLowerCase().replace(/:\d+$/, "");
  const wrongHost = host === `www.${SITE_DOMAIN}`;

  const qIndex = input.originalUrl.indexOf("?");
  const rawPath = qIndex === -1 ? input.originalUrl : input.originalUrl.slice(0, qIndex);
  const query = qIndex === -1 ? "" : input.originalUrl.slice(qIndex);

  let path = rawPath;
  const exempt = EXEMPT_PREFIXES.some((p) => path.startsWith(p));
  if (!exempt && path.length > 1 && path.endsWith("/")) {
    path = path.replace(/\/+$/, "") || "/";
  }
  const wrongSlash = path !== rawPath;

  if (!wrongHost && !wrongSlash) return null;
  // Host wrong → absolute apex URL; only the slash wrong → same host, relative.
  return wrongHost ? `${SITE_URL_PRODUCTION}${path}${query}` : `${path}${query}`;
}

export function canonicalRedirect(req: Request, res: Response, next: NextFunction): void {
  const target = canonicalRedirectTarget({
    method: req.method,
    host: req.headers.host,
    originalUrl: req.originalUrl,
  });
  if (target) {
    res.redirect(301, target);
    return;
  }
  next();
}
