# רוּחַ – Project TODO

## Phase 1: Core Features (Completed)
- [x] Database schema (users, articles, comments, attachments)
- [x] Authentication via Manus OAuth
- [x] Article CRUD operations
- [x] Basic comments system
- [x] Rich Text Editor (TipTap)
- [x] File attachments for articles
- [x] RTL Hebrew interface
- [x] Responsive design

## Phase 2: Additional Pages (Completed)
- [x] About page with mission and team
- [x] Contact page with form submission
- [x] Navigation links in header and footer

## Phase 3: Rich Text & Attachments (Completed)
- [x] TipTap Rich Text Editor with formatting toolbar
- [x] Attachments table and file upload UI
- [x] HTML rendering for article body
- [x] Display attachments on article detail page

## Phase 4: Admin Customization & Advanced Comments (Completed)
- [x] Add siteSettings table to schema (siteTitle, heroSubtitle)
- [x] Add guestPosts table (title, authorName, authorEmail, body, status, category)
- [x] Update comments table with parentCommentId for nested replies
- [x] Add likes table (userId, articleId/commentId, type)
- [x] Add userProfiles table (bio, joinDate, commentCount)
- [x] Run migrations for all new tables
- [x] Build admin settings panel to edit site name and hero subtitle
- [x] Update Home page to display dynamic site name and subtitle
- [x] Implement nested comment replies (show replies under parent)
- [x] Add reply button and reply form to each comment
- [x] Build guest post submission form (public page)
- [x] Create admin panel to approve/reject/delete guest posts
- [x] Add admin comment moderation (delete button for admin)
- [x] Add user comment deletion (users can only delete their own)
- [x] Implement likes system for articles and comments
- [x] Build user profile page showing user's comments and stats
- [x] Add email notifications for new replies and guest post approvals
- [x] Implement article search by title, tags, and content
- [x] Build tags/categories browsing page
- [x] Add "popular articles" section based on comment count
- [x] Test all features thoroughly
- [x] Save checkpoint with all features


## Bug Fixes & Enhancements – Phase 5 (Completed)
- [x] Add aboutPage table to schema for editable About content
- [x] Add guestPostApproved field to users table
- [x] Create migrations for new schema changes
- [x] Build admin About page editor in AdminSettings
- [x] Implement guest writer approval system (admin can approve/revoke)
- [x] Update Home.tsx to use dynamic site name from settings
- [x] Update SiteLayout to use dynamic site name
- [x] Update About page to display dynamic content from database
- [x] Add "Write Article" button for approved guest writers
- [x] Test all fixes
- [x] Save checkpoint with all fixes


## Audit Fixes – Phase 6 (Completed)
- [x] Fix AdminArticleForm.tsx parse error (line 193 two statements on same line)
- [x] Fix SiteLayout.tsx footer hardcoded site name → use dynamic settings
- [x] Fix articles.list to filter by published=true for public users
- [x] Fix createComment/createArticle to return created entity (not raw MySQL result)
- [x] Fix deleteComment admin bypass (don't filter by userId when admin deletes)
- [x] Fix About.tsx to render HTML content (not Markdown via Streamdown)
- [x] Build complete AdminUsers page with full user list API
- [x] Add /api/upload endpoint for file attachments
- [x] Fix all vitest tests (33 passing)
- [x] Add admin link to /admin/users in SiteLayout navigation
- [x] Convert seed articles from Markdown to HTML
- [x] Clean up test comments from database
- [x] Enhance prose-rtl CSS with comprehensive typography (h1-h4, blockquote, ul, ol, code, pre, hr, img, table)
- [x] Update GuestPostForm to use RichTextEditor instead of textarea
- [x] Add writerProcedure for admin OR approved guest writers
- [x] Rewrite routers.ts to remove Unicode parse errors
- [x] Add article likes button to ArticlePage
- [x] Add likes.userLike tRPC procedure for tracking user like state

## New Features – Phase 7 (Dynamic Categories & Newsletter)
- [x] Add categories table to schema (id, name, slug, description, color, sortOrder)
- [x] Add newsletterSubscribers table to schema (id, email, name, subscribedAt, active)
- [x] Run migrations for new tables
- [x] Create tRPC procedures for categories CRUD (admin only for create/update/delete)
- [x] Create tRPC procedure for newsletter subscription (public)
- [x] Build admin categories management page (add/edit/delete categories)
- [x] Update article creation form to use dynamic categories from DB
- [x] Update homepage category filter to use dynamic categories
- [x] Update category page to use dynamic categories
- [x] Build newsletter signup form on homepage
- [x] Verify RTE link support works correctly (already built-in)
- [x] Seed default categories (רוחניות, פילוסופיה, ריפוי)
- [x] Test all new features (45 tests passing)
- [x] Save checkpoint
- [x] Add inline edit functionality to AdminCategories page
- [x] Update GuestPostForm to use dynamic categories
- [x] Update AdminGuestPosts to use dynamic category labels
- [x] Update AdminPage stats to show dynamic category count
- [x] Update ArticlePage and ArticleCard to use dynamic category labels
- [x] Update CategoryPage to use dynamic categories
- [x] Remove/replace static CATEGORY_MAP usage across all files

## Feature – About Page Image Upload
- [x] Add imageUrl field to aboutPage table in schema
- [x] Run migration to add imageUrl column
- [x] Add tRPC mutation for uploading about image (admin only, via S3)
- [x] Update AdminSettings About editor with file upload button
- [x] Update public About page to display uploaded image
- [x] Write vitest test for about image upload procedure
- [x] Save checkpoint
