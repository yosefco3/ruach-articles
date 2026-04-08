# רוּחַ – Project TODO

## Database & Backend
- [x] Add articles table (id, title, slug, body, excerpt, coverImage, category, tags, authorId, published, createdAt, updatedAt)
- [x] Add comments table (id, articleId, userId, body, createdAt)
- [x] Run schema migration via webdev_execute_sql
- [x] DB helpers: getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle
- [x] DB helpers: getCommentsByArticle, createComment, deleteComment
- [x] tRPC router: articles.list (public, with category/tag filter)
- [x] tRPC router: articles.bySlug (public)
- [x] tRPC router: articles.create (admin only)
- [x] tRPC router: articles.update (admin only)
- [x] tRPC router: articles.delete (admin only)
- [x] tRPC router: comments.list (public)
- [x] tRPC router: comments.create (protected)
- [x] tRPC router: comments.delete (protected, own comments only)

## Frontend – Global
- [x] RTL Hebrew layout with proper font (Frank Ruhl Libre / Heebo)
- [x] Global CSS variables and design tokens (warm cream/gold palette)
- [x] Responsive top navigation with logo, category links, login/logout
- [x] Footer with site description

## Frontend – Pages
- [x] Homepage: hero section with featured article
- [x] Homepage: articles grid organized by category
- [x] Homepage: category filter tabs
- [x] Article detail page: full content, cover image, metadata
- [x] Article detail page: comments section (list + add comment form)
- [x] Category/tag browse page
- [x] Admin panel: article list with edit/delete actions
- [x] Admin panel: create/edit article form (title, slug, body, excerpt, cover image, category, tags, published toggle)
- [x] 404 page in Hebrew

## Auth & Access Control
- [x] Login via Manus OAuth only
- [x] Admin role check on all admin procedures
- [x] Users can only delete their own comments
- [x] Admin nav link visible only to admins

## Tests
- [x] Vitest: articles CRUD procedures
- [x] Vitest: comments create/delete with ownership check

## Polish & Content
- [x] Seed 6 sample articles (2 per category)
- [x] Responsive design verification (mobile/desktop)
- [x] Final checkpoint
