import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, writerCtx, adminCtx } from "../test-helpers/trpc";

describe("articles.list", () => {
  it("public callers see only published articles", async () => {
    const { caller, db } = makeCaller(publicCtx(), { getArticles: async () => [] });
    await caller.articles.list();
    expect(db.getArticles.mock.calls[0][0]).toMatchObject({ published: true });
  });

  it("admin with all:true sees unpublished too", async () => {
    const { caller, db } = makeCaller(adminCtx(), { getArticles: async () => [] });
    await caller.articles.list({ all: true });
    expect(db.getArticles.mock.calls[0][0]).toMatchObject({ published: undefined });
  });

  it("a regular user passing all:true still only sees published", async () => {
    const { caller, db } = makeCaller(userCtx(), { getArticles: async () => [] });
    await caller.articles.list({ all: true });
    expect(db.getArticles.mock.calls[0][0]).toMatchObject({ published: true });
  });
});

describe("articles.bySlug", () => {
  it("returns null and skips attachments when the article is missing", async () => {
    const { caller, db } = makeCaller(publicCtx(), { getArticleBySlug: async () => null });
    expect(await caller.articles.bySlug({ slug: "nope" })).toBeNull();
    expect(db.getAttachmentsByArticle).not.toHaveBeenCalled();
  });

  it("merges attachments when the article exists", async () => {
    const { caller } = makeCaller(publicCtx(), {
      getArticleBySlug: async () => ({ id: 5, slug: "hi", title: "Hi" }),
      getAttachmentsByArticle: async () => [{ id: 1, fileName: "a.pdf" }],
    });
    const result = await caller.articles.bySlug({ slug: "hi" });
    expect(result).toMatchObject({ id: 5, attachments: [{ id: 1, fileName: "a.pdf" }] });
  });
});

describe("articles.create guards", () => {
  it("rejects anonymous (UNAUTHORIZED) and regular users (FORBIDDEN)", async () => {
    await expect(
      makeCaller(publicCtx()).caller.articles.create({
        title: "t",
        slug: "s",
        body: "b",
        category: "c",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    await expect(
      makeCaller(userCtx()).caller.articles.create({
        title: "t",
        slug: "s",
        body: "b",
        category: "c",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("articles.create behaviour", () => {
  it("creates as unpublished, authored by the caller's dbId", async () => {
    const { caller, db } = makeCaller(writerCtx({ dbId: 7 }), {
      getArticleBySlug: async () => null,
      createArticle: async (a: Record<string, unknown>) => ({ id: 1, ...a }),
    });
    await caller.articles.create({ title: "t", slug: "hello", body: "b", category: "c" });
    expect(db.createArticle.mock.calls[0][0]).toMatchObject({ authorId: 7, published: false });
  });

  it("suffixes the slug when one already exists", async () => {
    const { caller, db } = makeCaller(writerCtx(), {
      getArticleBySlug: async () => ({ id: 99, slug: "hello" }),
      createArticle: async (a: Record<string, unknown>) => a,
    });
    await caller.articles.create({ title: "t", slug: "hello", body: "b", category: "c" });
    const storedSlug = db.createArticle.mock.calls[0][0].slug as string;
    expect(storedSlug).not.toBe("hello");
    expect(storedSlug.startsWith("hello-")).toBe(true);
  });

  it("falls back to a random slug when none is supplied", async () => {
    const { caller, db } = makeCaller(writerCtx(), {
      getArticleBySlug: async () => null,
      createArticle: async (a: Record<string, unknown>) => a,
    });
    await caller.articles.create({ title: "***", slug: "***", body: "b", category: "c" });
    const storedSlug = db.createArticle.mock.calls[0][0].slug as string;
    expect(storedSlug).toMatch(/^[a-z]+$/);
  });

  it("does not derive the slug from the title", async () => {
    const { caller, db } = makeCaller(writerCtx(), {
      getArticleBySlug: async () => null,
      createArticle: async (a: Record<string, unknown>) => a,
    });
    await caller.articles.create({ title: "שלום עולם", body: "b", category: "c" });
    const storedSlug = db.createArticle.mock.calls[0][0].slug as string;
    expect(storedSlug).toMatch(/^[a-z]+$/);
    expect(storedSlug).not.toContain("shlvm");
  });
});

describe("articles.update", () => {
  const ownedBy = (authorId: number) => ({
    getArticleById: async () => ({ id: 3, authorId }),
    updateArticle: async () => ({ id: 3 }),
  });

  it("does not forward id or siteUrl into the update payload", async () => {
    const { caller, db } = makeCaller(adminCtx(), ownedBy(1));
    await caller.articles.update({ id: 3, title: "new", siteUrl: "https://x.test" });
    const [id, data] = db.updateArticle.mock.calls[0];
    expect(id).toBe(3);
    expect(data).toEqual({ title: "new" });
  });

  it("rejects anonymous callers", async () => {
    await expect(
      makeCaller(publicCtx()).caller.articles.update({ id: 3, title: "new" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("lets the author edit their own article", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 7 }), ownedBy(7));
    await caller.articles.update({ id: 3, title: "new" });
    expect(db.updateArticle).toHaveBeenCalledWith(3, { title: "new" });
  });

  it("forbids editing someone else's article", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 7 }), ownedBy(8));
    await expect(caller.articles.update({ id: 3, title: "new" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(db.updateArticle).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when the article is missing", async () => {
    const { caller } = makeCaller(adminCtx(), { getArticleById: async () => null });
    await expect(caller.articles.update({ id: 3, title: "new" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("admins may edit any article, including its published flag", async () => {
    const { caller, db } = makeCaller(adminCtx(), ownedBy(7));
    await caller.articles.update({ id: 3, published: true });
    expect(db.updateArticle).toHaveBeenCalledWith(3, { published: true });
  });

  it("strips published for a non-admin author", async () => {
    const { caller, db } = makeCaller(writerCtx({ dbId: 7 }), ownedBy(7));
    await caller.articles.update({ id: 3, title: "new", published: true });
    expect(db.updateArticle).toHaveBeenCalledWith(3, { title: "new" });
  });
});

describe("articles.sendNewsletter", () => {
  it("throws NOT_FOUND when the article is missing", async () => {
    const { caller } = makeCaller(adminCtx(), { getArticleById: async () => null });
    await expect(
      caller.articles.sendNewsletter({ articleId: 1, siteUrl: "https://x.test" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("sends the newsletter with the article fields when found", async () => {
    const { caller, sendArticleNewsletter } = makeCaller(adminCtx(), {
      getArticleById: async () => ({
        title: "T",
        excerpt: "E",
        slug: "s",
        coverImage: "c.png",
        category: "cat",
      }),
    });
    await caller.articles.sendNewsletter({ articleId: 1, siteUrl: "https://x.test" });
    expect(sendArticleNewsletter).toHaveBeenCalledWith({
      title: "T",
      excerpt: "E",
      slug: "s",
      coverImage: "c.png",
      category: "cat",
      siteUrl: "https://x.test",
    });
  });

  it("is admin-only", async () => {
    await expect(
      makeCaller(writerCtx()).caller.articles.sendNewsletter({ articleId: 1, siteUrl: "https://x.test" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("articles.delete / reorder / attachments", () => {
  it("delete is admin-only and calls deleteArticle", async () => {
    await expect(makeCaller(writerCtx()).caller.articles.delete({ id: 4 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const { caller, db } = makeCaller(adminCtx());
    await expect(caller.articles.delete({ id: 4 })).resolves.toEqual({ success: true });
    expect(db.deleteArticle).toHaveBeenCalledWith(4);
  });

  const meta = { articleId: 1, fileName: "f.pdf", fileUrl: "https://x.test/f.pdf", fileSize: 10 };

  it("addAttachment forwards the metadata for the article's author", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 7 }), {
      getArticleById: async () => ({ id: 1, authorId: 7 }),
    });
    await caller.articles.addAttachment(meta);
    expect(db.createAttachment).toHaveBeenCalledWith(meta);
  });

  it("addAttachment forbids attaching to someone else's article", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 7 }), {
      getArticleById: async () => ({ id: 1, authorId: 8 }),
    });
    await expect(caller.articles.addAttachment(meta)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.createAttachment).not.toHaveBeenCalled();
  });

  it("deleteAttachment follows the parent article's ownership", async () => {
    const owned = {
      getAttachmentById: async () => ({ id: 1, articleId: 3 }),
      getArticleById: async () => ({ id: 3, authorId: 7 }),
    };
    const { caller, db } = makeCaller(userCtx({ dbId: 7 }), owned);
    await expect(caller.articles.deleteAttachment({ id: 1 })).resolves.toEqual({ success: true });
    expect(db.deleteAttachment).toHaveBeenCalledWith(1);

    const other = makeCaller(userCtx({ dbId: 8 }), owned);
    await expect(other.caller.articles.deleteAttachment({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(other.db.deleteAttachment).not.toHaveBeenCalled();
  });

  it("deleteAttachment throws NOT_FOUND for an unknown attachment", async () => {
    const { caller } = makeCaller(adminCtx(), { getAttachmentById: async () => null });
    await expect(caller.articles.deleteAttachment({ id: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
