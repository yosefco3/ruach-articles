import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, writerCtx, adminCtx } from "../test-helpers/trpc";

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
    expect(pub.db.getBookChapters).toHaveBeenCalledWith(3, { publishedOnly: true, role: undefined });
    const adm = makeCaller(adminCtx(), { getBookChapters: async () => [] });
    await adm.caller.articles.chaptersOfBook({ bookId: 3, all: true, role: "material" });
    expect(adm.db.getBookChapters).toHaveBeenCalledWith(3, { publishedOnly: false, role: "material" });
  });

  it("admin create/update carry bookId/chapterNo/chapterLabel through", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getArticleBySlug: async () => undefined,
      createArticle: async (d: Record<string, unknown>) => ({ id: 1, ...d }),
      getArticleById: async () => ({ id: 1, authorId: 99 }),
    });
    await caller.articles.create({ title: "פרק 1", body: "<p>x</p>", category: "derech-haruach", bookId: 3, bookRole: "material", chapterNo: 1, chapterLabel: "תרגיל" });
    expect(db.createArticle.mock.calls[0][0]).toMatchObject({ bookId: 3, bookRole: "material", chapterNo: 1, chapterLabel: "תרגיל" });
    await caller.articles.update({ id: 1, bookId: null, chapterNo: null });
    expect(db.updateArticle).toHaveBeenCalledWith(1, { bookId: null, chapterNo: null });
  });

  it("a non-admin writer cannot attach an article to a book (fields stripped)", async () => {
    const { caller, db } = makeCaller(writerCtx({ dbId: 7 }), {
      getArticleBySlug: async () => undefined,
      createArticle: async (d: Record<string, unknown>) => ({ id: 2, ...d }),
      getArticleById: async () => ({ id: 2, authorId: 7 }),
    });
    await caller.articles.create({ title: "x", body: "<p>x</p>", category: "c", bookId: 3, bookRole: "material", chapterNo: 1 });
    expect(db.createArticle.mock.calls[0][0]).not.toHaveProperty("bookId");
    expect(db.createArticle.mock.calls[0][0]).not.toHaveProperty("bookRole");
    await caller.articles.update({ id: 2, title: "y", bookId: 3, chapterLabel: "פרק" });
    expect(db.updateArticle).toHaveBeenCalledWith(2, { title: "y" });
  });
});

// מורה מקושר (teachers.userId) כותב ומפרסם בעצמו; מאמריו נרשמים על שמו.
describe("articles — linked teacher", () => {
  const teacherRow = { id: 3, userId: 7, slug: "moreh", name: "מורה", visible: true };

  it("a linked teacher may create and publish; teacherId is forced to their own", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 7 }), {
      getTeacherByUserId: async (uid: number) => (uid === 7 ? teacherRow : undefined),
      getArticleBySlug: async () => undefined,
      createArticle: async (d: Record<string, unknown>) => ({ id: 9, ...d }),
    });
    await caller.articles.create({ title: "x", body: "<p>x</p>", category: "teacher", published: true, teacherId: 99 });
    expect(db.createArticle.mock.calls[0][0]).toMatchObject({ teacherId: 3, published: true, authorId: 7 });
  });

  it("a linked teacher may flip published on their own article but not reassign teacherId", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 7 }), {
      getTeacherByUserId: async () => teacherRow,
      getArticleById: async () => ({ id: 9, authorId: 7 }),
    });
    await caller.articles.update({ id: 9, published: true, teacherId: 99 });
    expect(db.updateArticle).toHaveBeenCalledWith(9, { published: true });
  });

  it("a plain user who is not a teacher cannot create at all", async () => {
    const { caller } = makeCaller(userCtx({ dbId: 8 }), { getTeacherByUserId: async () => undefined });
    await expect(caller.articles.create({ title: "x", body: "<p>x</p>", category: "c" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin may assign teacherId explicitly", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getArticleBySlug: async () => undefined,
      createArticle: async (d: Record<string, unknown>) => ({ id: 1, ...d }),
    });
    await caller.articles.create({ title: "x", body: "<p>x</p>", category: "teacher", teacherId: 3, published: true });
    expect(db.createArticle.mock.calls[0][0]).toMatchObject({ teacherId: 3, published: true });
  });
});
