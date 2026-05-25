import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { contactRouter } from "../contact";
import { articlesRouter } from "./articles.router";
import { commentsRouter } from "./comments.router";
import { categoriesRouter } from "./categories.router";
import { newsletterRouter } from "./newsletter.router";
import { likesRouter } from "./likes.router";
import { guestPostsRouter } from "./guestPosts.router";
import { guestWritersRouter } from "./guestWriters.router";
import { settingsRouter } from "./settings.router";
import { aboutRouter } from "./about.router";
import { profilesRouter } from "./profiles.router";
import { usersRouter } from "./users.router";
import { featuredArticleRouter } from "./featured.router";
import { authRouter } from "./auth.router";

/**
 * Main application router
 * Combines all domain-specific routers
 */
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  articles: articlesRouter,
  comments: commentsRouter,
  contact: contactRouter,
  settings: settingsRouter,
  about: aboutRouter,
  guestPosts: guestPostsRouter,
  guestWriters: guestWritersRouter,
  likes: likesRouter,
  profiles: profilesRouter,
  users: usersRouter,
  categories: categoriesRouter,
  newsletter: newsletterRouter,
  featured: featuredArticleRouter,
});

export type AppRouter = typeof appRouter;