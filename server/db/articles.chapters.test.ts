import { describe, it, expect, afterAll } from "vitest";
import { getDb } from "./connection";
import { createArticle, getBookChapters, getArticleBySlug, getArticles } from "./articles";
import { articles } from "../../drizzle/schema";
import { like } from "drizzle-orm";

const P = `__test-ch-${Date.now()}`;
const BOOK = 987654; // מזהה ספר מדומה — אין FK

afterAll(async () => {
  const db = await getDb();
  if (db) await db.delete(articles).where(like(articles.slug, "__test-ch-%"));
});

describe("book chapters (db)", () => {
  it("orders by chapterNo and hides drafts unless asked", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available — is docker compose up?");
    const mk = (n: number, published: boolean) =>
      createArticle({ title: `פרק ${n}`, slug: `${P}-${n}`, body: "<p>x</p>", category: "book", authorId: 1,
        published, bookId: BOOK, chapterNo: n, chapterLabel: `פרק ${n}` });
    await mk(2, true); await mk(1, true); await mk(3, false);

    const pub = await getBookChapters(BOOK);
    expect(pub.map((c) => c.chapterNo)).toEqual([1, 2]);
    const all = await getBookChapters(BOOK, { publishedOnly: false });
    expect(all.map((c) => c.chapterNo)).toEqual([1, 2, 3]);

    expect(await getArticleBySlug(`${P}-1`)).toMatchObject({ bookId: BOOK, chapterNo: 1, chapterLabel: "פרק 1" });
    expect((await getArticles({ bookId: BOOK, published: true })).length).toBe(2);
  });
});
