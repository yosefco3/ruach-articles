import { lazy } from "react";

// ── Public pages ──────────────────────────────────────────
export const LazyHome = lazy(() => import("../pages/Home"));
export const LazyArticlePage = lazy(() => import("../pages/ArticlePage"));
export const LazyCategoryPage = lazy(() => import("../pages/CategoryPage"));
export const LazyAbout = lazy(() => import("../pages/About"));
export const LazyContact = lazy(() => import("../pages/Contact"));
export const LazyGuestPostForm = lazy(() => import("../pages/GuestPostForm"));
export const LazyUserProfile = lazy(() => import("../pages/UserProfile"));

// ── Admin pages (separate chunk) ──────────────────────────
export const LazyAdminPage = lazy(() => import("../pages/AdminPage"));
export const LazyAdminArticleForm = lazy(() => import("../pages/AdminArticleForm"));
export const LazyAdminArticleOrder = lazy(() => import("../pages/AdminArticleOrder"));
export const LazyAdminCategories = lazy(() => import("../pages/AdminCategories"));
export const LazyAdminGuestPosts = lazy(() => import("../pages/AdminGuestPosts"));
export const LazyAdminNewsletter = lazy(() => import("../pages/AdminNewsletter"));
export const LazyAdminSettings = lazy(() => import("../pages/AdminSettings"));
export const LazyAdminUsers = lazy(() => import("../pages/AdminUsers"));