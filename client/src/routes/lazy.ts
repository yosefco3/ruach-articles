import { lazy } from "react";

// ── Public pages ──────────────────────────────────────────
export const LazyHome = lazy(() => import("../pages/Home"));
export const LazyArticlePage = lazy(() => import("../pages/ArticlePage"));
export const LazyCategoryPage = lazy(() => import("../pages/CategoryPage"));
export const LazyAbout = lazy(() => import("../pages/About"));
export const LazyDerech = lazy(() => import("../pages/Derech"));
export const LazyContact = lazy(() => import("../pages/Contact"));
export const LazyAccessibility = lazy(() => import("../pages/Accessibility"));
export const LazyGuestPostForm = lazy(() => import("../pages/GuestPostForm"));
export const LazyUserProfile = lazy(() => import("../pages/UserProfile"));
export const LazyIChing = lazy(() => import("../pages/IChingReading"));
export const LazyTarot = lazy(() => import("../pages/TarotReading"));
export const LazyTarotDeck = lazy(() => import("../pages/TarotDeckGallery"));
export const LazyTarotCard = lazy(() => import("../pages/TarotCardPage"));
export const LazyTarotGuide = lazy(() => import("../pages/TarotGuide"));

// ── Admin pages (separate chunk) ──────────────────────────
export const LazyAdminPage = lazy(() => import("../pages/AdminPage"));
export const LazyAdminArticleForm = lazy(() => import("../pages/AdminArticleForm"));
export const LazyAdminArticleOrder = lazy(() => import("../pages/AdminArticleOrder"));
export const LazyAdminCategories = lazy(() => import("../pages/AdminCategories"));
export const LazyAdminGuestPosts = lazy(() => import("../pages/AdminGuestPosts"));
export const LazyAdminNewsletter = lazy(() => import("../pages/AdminNewsletter"));
export const LazyAdminSettings = lazy(() => import("../pages/AdminSettings"));
export const LazyAdminUsers = lazy(() => import("../pages/AdminUsers"));
export const LazyAdminIChing = lazy(() => import("../pages/AdminIChing"));
export const LazyAdminTarot = lazy(() => import("../pages/AdminTarot"));
export const LazyAdminDerech = lazy(() => import("../pages/AdminDerech"));