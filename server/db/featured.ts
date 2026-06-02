import { eq } from "drizzle-orm";
import { articles, featuredArticle } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function getFeaturedArticle() {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(featuredArticle).limit(1);
  if (rows.length === 0) return undefined;
  const featured = rows[0];
  const article = await db.select().from(articles).where(eq(articles.id, featured.articleId)).limit(1);
  return article.length > 0 ? article[0] : undefined;
}

export async function setFeaturedArticle(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(featuredArticle).limit(1);
  if (rows.length > 0) {
    await db.update(featuredArticle).set({ articleId }).where(eq(featuredArticle.id, rows[0].id));
  } else {
    await db.insert(featuredArticle).values({ articleId });
  }
}