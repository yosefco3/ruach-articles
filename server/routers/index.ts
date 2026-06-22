import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { contactRouter } from "../contact";
import { createArticlesRouter } from "./articles.router";
import { createCommentsRouter } from "./comments.router";
import { createCategoriesRouter } from "./categories.router";
import { createNewsletterRouter } from "./newsletter.router";
import { createLikesRouter } from "./likes.router";
import { createGuestPostsRouter } from "./guestPosts.router";
import { createGuestWritersRouter } from "./guestWriters.router";
import { createSettingsRouter } from "./settings.router";
import { createAboutRouter } from "./about.router";
import { createProfilesRouter } from "./profiles.router";
import { createUsersRouter } from "./users.router";
import { createFeaturedRouter } from "./featured.router";
import { createAuthRouter } from "./auth.router";
import { createIchingRouter } from "./iching.router";
import type { RouterDeps } from "./context";

/**
 * Create the main application router with injected dependencies.
 * All domain-specific routers receive deps instead of importing db directly.
 */
export const createAppRouter = (deps: RouterDeps) => router({
  system: systemRouter,
  auth: createAuthRouter(),
  articles: createArticlesRouter(deps),
  comments: createCommentsRouter(deps),
  contact: contactRouter,
  settings: createSettingsRouter(deps),
  about: createAboutRouter(deps),
  guestPosts: createGuestPostsRouter(deps),
  guestWriters: createGuestWritersRouter(deps),
  likes: createLikesRouter(deps),
  profiles: createProfilesRouter(deps),
  users: createUsersRouter(deps),
  categories: createCategoriesRouter(deps),
  newsletter: createNewsletterRouter(deps),
  featured: createFeaturedRouter(deps),
  iching: createIchingRouter(deps),
});

// Convenience: create with default deps for backward compatibility
import * as db from "../db";
import { sendArticleNewsletter } from "../newsletterEmail";
import { generateIchingInterpretation } from "../ichingAi";
import { env } from "../_core/env";

const defaultDeps: RouterDeps = {
  db,
  sendArticleNewsletter,
  generateIchingInterpretation,
  ichingAiMonthlyLimit: env.ICHING_AI_MONTHLY_LIMIT,
};

export const appRouter = createAppRouter(defaultDeps);
export type AppRouter = typeof appRouter;