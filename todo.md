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

## Bug Fixes
- [x] Remove URL field from article cover image input — use file upload only
- [x] Fix oversized/cropped cover image on article page
- [x] Fix oversized/cropped image on about page
- [x] Fix article edit/update not working
- [x] Fix article edit form: RichTextEditor shows empty body when editing existing article
- [x] Improve image styling: rounded corners, correct proportions, shadow, elegant framing (article page, about page, article cards, form preview)
- [x] Fix featured article card on homepage — oversized/full-bleed, needs proper container sizing
- [x] Fix RichTextEditor toolbar buttons submitting the form — add type="button" to all toolbar buttons
- [x] Convert site to dark theme — update CSS variables, ThemeProvider, and all hardcoded light colors

## Feature – Featured Article Selection
- [x] Add featuredArticle table to schema (articleId FK, updatedAt)
- [x] Run migration to create table
- [x] Add tRPC procedures: getFeaturedArticle, setFeaturedArticle (admin only)
- [x] Add featured article selector button to AdminPage
- [x] Update Home.tsx to display selected featured article
- [x] Create test articles and verify display
- [x] Write vitest tests for featured article procedures (3 tests passing)
- [x] Save checkpoint
- [x] Fix featured article star UI — show filled star only for current featured, outline for others

## Feature – Contact Email
- [x] Add contactEmail field to siteSettings table in schema
- [x] Run migration to add contactEmail column
- [x] Add contactEmail to AdminSettings editor (site settings tab)
- [x] Add contact.getEmail public procedure to expose email to frontend
- [x] Update contact.submit tRPC procedure to include contactEmail in notification
- [x] Update Contact page to display dynamic contactEmail from DB
- [x] Write vitest tests (59 passing)
- [x] Save checkpoint
- [x] Add dedicated vitest tests for contact.getEmail and settings.update with contactEmail (64 tests passing)
- [x] Hide "כתוב אתנו" (guest post) from public nav and route
- [x] Fix slug field not saved when editing article — added slug to update procedure input schema and mutate call

## Bug – Hardcoded Site Name
- [x] Fix browser tab title to use dynamic site name from settings
- [x] Fix email notification content to use dynamic site name (contact form, notifications)
- [x] Audit and fix any other hardcoded "רוח" site name occurrences

## Feature – Enhanced Rich Text Editor
- [x] Install TipTap extension packages: Color, Highlight, TextAlign, Underline, Superscript, Subscript, Typography, TextStyle, FontFamily, Table
- [x] Add text color picker to toolbar (full color palette)
- [x] Add text highlight/background color picker to toolbar
- [x] Add text alignment buttons (right, center, left, justify)
- [x] Add RTL/LTR direction toggle buttons
- [x] Add underline button
- [x] Add superscript and subscript buttons
- [x] Add blockquote button (already in StarterKit, expose in toolbar)
- [x] Add horizontal rule button
- [x] Add heading H1 button (in addition to H2, H3)
- [x] Add font size selector
- [x] Add table insertion and management
- [x] Add clear formatting button
- [x] Organize toolbar into logical groups with separators
- [x] Update RichTextEditor.css for new elements (table, color marks, etc.)
- [x] Run all tests to confirm nothing broken

## Bug – Text Selection in Editor
- [x] Fix: cannot select text inside the rich text editor (click/drag does not highlight text)

## Bug – Category Page Missing Featured Article
- [x] Fix: category page does not show the article that is set as the featured article (it is excluded from the list)

## Bug – About Page Content Wiped on Deploy
- [x] Fix: About page content is deleted/reset every time a checkpoint is saved or the server restarts — fixed RichTextEditor readyRef guard to prevent empty-string onChange on mount before async value arrives

## Feature – About Page Redesign
- [x] Redesign About page with improved layout, typography, visual hierarchy matching the site's dark golden aesthetic

## Bug – Article Creation SQL Error
- [x] Fix: creating a new article fails with SQL INSERT error on the articles table — slugify now generates timestamp-based slug for Hebrew titles

## Bug – Slug Regenerated on Every Update
- [x] Fix: updating an article creates a new slug instead of keeping the existing one

## Bug – Tests Pollute Production Database
- [x] Fix: running tests creates real data (articles, categories, newsletter subscribers) in the production database — all tests now use vi.mock for db module
- [x] Clean up test data already created in production DB — removed 17 fake newsletter subscribers

## Bug – Article Page Starts at Wrong Scroll Position
- [x] Fix: when opening an article, the page starts scrolled to the body instead of the title — added ScrollToTop component

## Bug – Category Drag-and-Drop Reordering Not Working
- [x] Fix: drag-and-drop to reorder categories in admin page does not work — implemented real drag-and-drop with @dnd-kit and server-side sortOrder persistence
