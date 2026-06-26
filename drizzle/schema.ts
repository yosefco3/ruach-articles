import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  guestPostApproved: boolean("guestPostApproved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  coverImage: varchar("coverImage", { length: 1024 }),
  category: varchar("category", { length: 128 }).notNull(),
  tags: varchar("tags", { length: 512 }).default(""),
  authorId: int("authorId").notNull(),
  published: boolean("published").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  body: text("body").notNull(),
  parentCommentId: int("parentCommentId"), // for nested replies
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  siteTitle: varchar("siteTitle", { length: 256 }).default("רוּחַ").notNull(),
  heroSubtitle: varchar("heroSubtitle", { length: 512 }).default("רוחניות xb7 פילוסופיה xb7 ריפוי").notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

export const guestPosts = mysqlTable("guestPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  authorName: varchar("authorName", { length: 256 }).notNull(),
  authorEmail: varchar("authorEmail", { length: 320 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GuestPost = typeof guestPosts.$inferSelect;
export type InsertGuestPost = typeof guestPosts.$inferInsert;

export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId"), // null if liking a comment
  commentId: int("commentId"), // null if liking an article
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bio: text("bio"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export const aboutPage = mysqlTable("aboutPage", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).default("אודות").notNull(),
  content: text("content").notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AboutPage = typeof aboutPage.$inferSelect;
export type InsertAboutPage = typeof aboutPage.$inferInsert;

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: varchar("description", { length: 512 }),
  color: varchar("color", { length: 32 }).default("#8B6914"),
  coverImage: varchar("coverImage", { length: 1024 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 256 }),
  active: boolean("active").default(true).notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

export const featuredArticle = mysqlTable("featuredArticle", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeaturedArticle = typeof featuredArticle.$inferSelect;
export type InsertFeaturedArticle = typeof featuredArticle.$inferInsert;

// ── I Ching ─────────────────────────────────────────────
// טקסט פירוש בלבד. המבנה (טריגרמות/הקסגרמות/lookup) חי ב-shared/iching.

// 3 אזורי העריכה של מסך האדמין (ראה STYLE_GUIDE.md). הכותרת (שם+מבנה טריגרמות)
// נגזרת מ-shared/iching ואינה נשמרת כאן.
export const ichingHexagramText = mysqlTable("ichingHexagramText", {
  number: int("number").primaryKey(), // 1..64, תואם King Wen ב-shared
  name: varchar("name", { length: 128 }).default("").notNull(), // override לשם המנוקד; ריק = ברירת המחדל מ-shared
  trigramExplanation: text("trigramExplanation").notNull(), // "הטריגרמות" — ניתוח שתי הטריגרמות
  interpretation: text("interpretation").notNull(), // "פירוש ההקסגרמה" — HTML עשיר (מסרים מרכזיים ככותרות + יישום מעשי)
  // "קווים משתנים" — טקסט אופציונלי לכל קו, קו 1 = הקו התחתון (תואם reading.changing)
  line1: text("line1").default("").notNull(),
  line2: text("line2").default("").notNull(),
  line3: text("line3").default("").notNull(),
  line4: text("line4").default("").notNull(),
  line5: text("line5").default("").notNull(),
  line6: text("line6").default("").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IchingHexagramText = typeof ichingHexagramText.$inferSelect;
export type InsertIchingHexagramText = typeof ichingHexagramText.$inferInsert;

export const ichingTrigramText = mysqlTable("ichingTrigramText", {
  trigramKey: varchar("trigramKey", { length: 16 }).primaryKey(), // qian, kun, ...
  name: varchar("name", { length: 64 }).default("").notNull(), // override לשם; ריק = ברירת המחדל מ-shared
  element: varchar("element", { length: 64 }).default("").notNull(), // override ליסוד (אֵשׁ/מַיִם…); מזין גם את תווית היחס
  attr: varchar("attr", { length: 128 }).default("").notNull(), // override לתכונה
  description: text("description").notNull(), // HTML עשיר (TipTap) — נערך ב-RichTextEditor כמו interpretation
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IchingTrigramText = typeof ichingTrigramText.$inferSelect;
export type InsertIchingTrigramText = typeof ichingTrigramText.$inferInsert;

// ברירות המחדל זהות לאב-טיפוס.
export const ichingIntro = mysqlTable("ichingIntro", {
  id: int("id").autoincrement().primaryKey(), // singleton
  articleHtml: text("articleHtml").notNull(), // המאמר הקצר בראש הדף (HTML מ-TipTap)
  questionPrompt: varchar("questionPrompt", { length: 512 })
    .default("מה ברצונך לשאול?")
    .notNull(),
  questionHint: varchar("questionHint", { length: 512 })
    .default("השאלה אישית ואינה נשמרת בשום מקום.")
    .notNull(),
  buttonLabel: varchar("buttonLabel", { length: 128 })
    .default("הַטֵּל אֶת הַמַּטְבְּעוֹת")
    .notNull(),
  // שכלול ניסוח השאלה לפני ההטלה — כיבוי/הדלקה מפאנל האדמין.
  refineEnabled: boolean("refineEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IchingIntro = typeof ichingIntro.$inferSelect;
export type InsertIchingIntro = typeof ichingIntro.$inferInsert;

// מונה שימושי AI חודשיים לכל משתמש. שומר *רק* מונה — לעולם לא שאלה/תשובה.
export const ichingAiUsage = mysqlTable(
  "ichingAiUsage",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // → users.id
    monthYear: varchar("monthYear", { length: 7 }).notNull(), // "YYYY-MM"
    usageCount: int("usageCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    // המפתח שמאפשר upsert אטומי (ON DUPLICATE KEY) ב-increment — צעד 03.
    uniqUserMonth: unique("uniq_iching_usage_user_month").on(t.userId, t.monthYear),
  }),
);

export type IchingAiUsage = typeof ichingAiUsage.$inferSelect;
export type InsertIchingAiUsage = typeof ichingAiUsage.$inferInsert;
