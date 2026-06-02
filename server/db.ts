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
  getArticles, getNextArticleInCategory, getRandomArticle,
  getArticleBySlug, getArticleById, createArticle, updateArticle,
  deleteArticle, reorderArticles,
} from "./db/articles";

// Comments
export {
  getCommentsByArticle, createComment, deleteComment, getCommentById,
} from "./db/comments";

// Attachments
export {
  getAttachmentsByArticle, createAttachment, deleteAttachment,
  deleteAttachmentsByArticle,
} from "./db/attachments";

// Settings
export { getSiteSettings, updateSiteSettings } from "./db/settings";

// Guest Posts
export {
  getGuestPosts, createGuestPost, updateGuestPostStatus, deleteGuestPost,
} from "./db/guest-posts";

// Likes
export { getLikeCount, getUserLike, createLike, deleteLike } from "./db/likes";

// Profiles
export {
  getUserProfile, createUserProfile, updateUserProfile, getUserCommentCount,
} from "./db/profiles";

// About
export { getAboutPage, updateAboutPage } from "./db/about";

// Guest Writers
export {
  approveGuestWriter, revokeGuestWriter, getApprovedGuestWriters,
} from "./db/guest-writers";

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