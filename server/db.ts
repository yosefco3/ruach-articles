/**
 * Backward-compatibility shim.
 * All database logic has been moved to server/db/*.ts modules.
 * This file re-exports everything so existing imports continue to work.
 */
export { getDb } from "./db/connection";

// Users
export { upsertUser, getUserByOpenId, getAllUsers } from "./db/users";

// Articles
export {
  getArticles, getBookChapters, getNextArticleInCategory, getRandomArticle,
  getArticleBySlug, getArticleById, createArticle, updateArticle,
  deleteArticle, reorderArticles,
} from "./db/articles";

// Comments
export {
  getCommentsByArticle, createComment, deleteComment, getCommentById,
} from "./db/comments";

// Attachments
export {
  getAttachmentsByArticle, getAttachmentById, createAttachment, deleteAttachment,
  deleteAttachmentsByArticle,
} from "./db/attachments";

// Settings
export { getSiteSettings, updateSiteSettings } from "./db/settings";

// Likes
export { getLikeCount, getUserLike, createLike, deleteLike } from "./db/likes";

// Profiles
export {
  getUserProfile, createUserProfile, updateUserProfile, getUserCommentCount,
} from "./db/profiles";

// About
export { getAboutPage, updateAboutPage } from "./db/about";

// Derech (method page)
export { getDerechContent, updateDerechContent } from "./db/derech";

// Categories
export {
  getAllCategories, getCategories, getCategoryBySlug, createCategory,
  updateCategory, reorderCategories, getCategoriesWithArticleCount,
  deleteCategory, reorderCategoryArticles,
} from "./db/categories";

// Featured
export { getFeaturedArticle, setFeaturedArticle } from "./db/featured";

// Newsletter
export {
  subscribeToNewsletter, unsubscribeFromNewsletter,
  getNewsletterSubscribers, deleteNewsletterSubscriber,
  searchNewsletterSubscribers,
} from "./db/newsletter";

// I Ching
export {
  listHexagramTexts, getHexagramText, upsertHexagramText,
  listTrigramTexts, upsertTrigramText,
  getIchingIntro, updateIchingIntro,
} from "./db/iching";

// I Ching — AI usage quota
export {
  currentMonthYear, getMonthlyUsage, incrementMonthlyUsage,
} from "./db/ichingUsage";
// Tarot
export {
  DEFAULT_TAROT_INTRO,
  listCardTexts, getCardText, upsertCardText,
  getTarotIntro, updateTarotIntro,
} from "./db/tarot";

// Tarot — AI usage quota (separate counter from the I Ching)
export {
  getTarotMonthlyUsage, incrementTarotMonthlyUsage,
} from "./db/tarotUsage";

// Books (site-pivot-books)
export {
  listBooks, getBookBySlug, getBookById, createBook, updateBook, deleteBook, reorderBooks,
} from "./db/books";

// Teachers (site-pivot-books)
export {
  listTeachers, getTeacherBySlug, getTeacherById, getTeacherByUserId, createTeacher, updateTeacher,
  deleteTeacher, reorderTeachers, getTeacherArticles, getUserByEmail,
} from "./db/teachers";

// Events (site-pivot-books — hidden infrastructure)
export { listEvents, listPastEvents, getEventBySlug, getEventById, createEvent, updateEvent, deleteEvent } from "./db/events";
