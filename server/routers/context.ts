// Router Dependency Injection Context
// Centralizes all external dependencies consumed by routers.
// Pass this into each router factory so no router imports db/external modules directly.

import type * as db from "../db";
import type { ArticleEmailPayload } from "../newsletterEmail";

export interface RouterDeps {
  db: typeof db;
  sendArticleNewsletter: (article: ArticleEmailPayload) => Promise<{ sent: number; failed: number }>;
}