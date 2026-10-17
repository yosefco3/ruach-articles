import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, writerCtx, adminCtx } from "../test-helpers/trpc";

// פרקי דוגמה (site-pivot-books): שיוך מאמר לספר הוא החלטת אדמין בלבד.
describe("articles — chapter fields", () => {
  it("list forwards bookId", async () => {
    const { caller, db } = makeCaller(publicCtx(), { getArticles: async () => [] });
    await caller.articles.list({ bookId: 3 });
    expect(db.getArticles.mock.calls[0][0]).toMatchObject({ bookId: 3, published: true });
  });

  it("chaptersOfBook: public gets published only; admin with all gets drafts too", async () => {
    const pub = makeCaller(publicCtx(), { getBookChapters: async () => [] });
    await pub.caller.articles.chaptersOfBook({ bookId: 3, all: true });
    expect(pub.db.getBookChapters).toHaveBeenCalledWith(3, { publishedOnly: true });
    const adm = makeCaller(adminCtx(), { getBookChapters: async () => [] });
    await adm.caller.articles.chaptersOfBook({ bookId: 3, all: true });
    expect(adm.db.getBookChapters).toHaveBeenCalledWith(3, { publishedOnly: false });
  });

  it("admin create/update carry bookId/chapterNo/chapterLabel through", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getArticleBySlug: async () => undefined,
      createArticle: async (d: Record<string, unknown>) => ({ id: 1, ...d }),
      getArticleById: async () => ({ id: 1, authorId: 99 }),
    });
    await caller.articles.create({ title: "פרק 1", body: "<p>x</p>", category: "derech-haruach", bookId: 3, chapterNo: 1, chapterLabel: "פרק 1" });
    expect(db.createArticle.mock.calls[0][0]).toMatchObject({ bookId: 3, chapterNo: 1, chapterLabel: "פרק 1" });
    await caller.articles.update({ id: 1, bookId: null, chapterNo: null });
    expect(db.updateArticle).toHaveBeenCalledWith(1, { bookId: null, chapterNo: null });
  });

  it("a non-admin writer cannot attach an article to a book (fields stripped)", async () => {
    const { caller, db } = makeCaller(writerCtx({ dbId: 7 }), {
      getArticleBySlug: async () => undefined,
      createArticle: async (d: Record<string, unknown>) => ({ id: 2, ...d }),
      getArticleById: async () => ({ id: 2, authorId: 7 }),
    });
    await caller.articles.create({ title: "x", body: "<p>x</p>", category: "c", bookId: 3, chapterNo: 1 });
    expect(db.createArticle.mock.calls[0][0]).not.toHaveProperty("bookId");
    await caller.articles.update({ id: 2, title: "y", bookId: 3, chapterLabel: "פרק" });
    expect(db.updateArticle).toHaveBeenCalledWith(2, { title: "y" });
  });
});
