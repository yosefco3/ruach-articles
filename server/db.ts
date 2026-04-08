import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { articles, comments, users, attachments, type InsertArticle, type InsertComment, type InsertUser, type InsertAttachment } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export async function getArticles(opts?: { category?: string; published?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.published !== undefined) conditions.push(eq(articles.published, opts.published));
  if (opts?.category && ["spirituality", "philosophy", "healing"].includes(opts.category)) {
    conditions.push(eq(articles.category, opts.category as "spirituality" | "philosophy" | "healing"));
  }
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      coverImage: articles.coverImage,
      category: articles.category,
      tags: articles.tags,
      published: articles.published,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorId: articles.authorId,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(articles.createdAt));
  return rows;
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      body: articles.body,
      coverImage: articles.coverImage,
      category: articles.category,
      tags: articles.tags,
      published: articles.published,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorId: articles.authorId,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.slug, slug))
    .limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function createArticle(data: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articles).values(data);
  return result;
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete comments first
  await db.delete(comments).where(eq(comments.articleId, id));
  await db.delete(articles).where(eq(articles.id, id));
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function getCommentsByArticle(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: comments.id,
      articleId: comments.articleId,
      userId: comments.userId,
      body: comments.body,
      createdAt: comments.createdAt,
      userName: users.name,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.articleId, articleId))
    .orderBy(desc(comments.createdAt));
  return rows;
}

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(data);
  return result;
}

export async function deleteComment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Only delete if owned by the user
  await db.delete(comments).where(and(eq(comments.id, id), eq(comments.userId, userId)));
}

export async function getCommentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export async function getAttachmentsByArticle(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(attachments).where(eq(attachments.articleId, articleId)).orderBy(desc(attachments.uploadedAt));
  return rows;
}

export async function createAttachment(data: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(attachments).values(data);
  return result;
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(attachments).where(eq(attachments.id, id));
}

export async function deleteAttachmentsByArticle(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(attachments).where(eq(attachments.articleId, articleId));
}
