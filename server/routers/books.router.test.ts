import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";

const row = (o: Record<string, unknown> = {}) => ({
  id: 1, slug: "derech-haruach", title: "דרך הרוח", subtitle: "הנבואה הטבעית", blurb: "<p>x</p>",
  coverImage: null, status: "coming_soon", visible: true, publisher: "", purchaseLinks: null,
  tocJson: JSON.stringify(["שער הפתיחה", "שער א"]), year: null, pages: null, isbn: "", sortOrder: 0,
  createdAt: new Date(), updatedAt: new Date(), ...o,
});

describe("books router", () => {
  it("list is public, asks for visible books only, and decodes JSON columns", async () => {
    const { caller, db } = makeCaller(publicCtx(), {
      listBooks: async () => [row({ purchaseLinks: '[{"label":"בוקפוד","url":"https://b.co.il/x","kind":"print"}]' })],
    });
    const list = await caller.books.list();
    expect(db.listBooks).toHaveBeenCalledWith({ visibleOnly: true });
    expect(list[0]).toMatchObject({
      slug: "derech-haruach",
      purchaseLinks: [{ label: "בוקפוד", url: "https://b.co.il/x", kind: "print" }],
      toc: ["שער הפתיחה", "שער א"],
    });
    expect(list[0]).not.toHaveProperty("tocJson");
  });

  it("bySlug: hidden book is NOT_FOUND for visitors but visible to admins", async () => {
    const hidden = { getBookBySlug: async () => row({ visible: false }) };
    await expect(makeCaller(publicCtx(), hidden).caller.books.bySlug({ slug: "derech-haruach" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(makeCaller(userCtx(), hidden).caller.books.bySlug({ slug: "derech-haruach" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(makeCaller(adminCtx(), hidden).caller.books.bySlug({ slug: "derech-haruach" }))
      .resolves.toMatchObject({ slug: "derech-haruach", visible: false });
    await expect(makeCaller(publicCtx(), { getBookBySlug: async () => undefined }).caller.books.bySlug({ slug: "nope" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("mutations are admin-only", async () => {
    const input = { slug: "x", title: "x" };
    await expect(makeCaller(userCtx()).caller.books.create(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(makeCaller(publicCtx()).caller.books.create(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(makeCaller(userCtx()).caller.books.listAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(makeCaller(userCtx()).caller.books.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("create encodes links/toc as JSON and rejects a duplicate slug", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getBookBySlug: async () => undefined,
      createBook: async (d: Record<string, unknown>) => row({ ...d }),
    });
    const created = await caller.books.create({
      slug: "lahi-haharedi", title: "לאחי החרדי", status: "writing",
      purchaseLinks: [{ label: "עברית", url: "https://evrit.co.il/y", kind: "ebook" }],
      toc: ["פרק 1"],
    });
    expect(db.createBook).toHaveBeenCalledWith(expect.objectContaining({
      slug: "lahi-haharedi",
      purchaseLinks: '[{"label":"עברית","url":"https://evrit.co.il/y","kind":"ebook"}]',
      tocJson: '["פרק 1"]',
    }));
    expect(created).toMatchObject({ toc: ["פרק 1"], purchaseLinks: [{ kind: "ebook" }] });

    await expect(
      makeCaller(adminCtx(), { getBookBySlug: async () => row() }).caller.books.create({ slug: "derech-haruach", title: "x" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("validates input: bad slug, bad url, unknown status", async () => {
    const { caller } = makeCaller(adminCtx());
    await expect(caller.books.create({ slug: "has space", title: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.books.create({ slug: "ok", title: "x", purchaseLinks: [{ label: "a", url: "not-a-url", kind: "print" }] }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.books.create({ slug: "ok", title: "x", status: "sold_out" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("update passes only the given fields, guards slug clashes, NOT_FOUND when missing", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getBookBySlug: async () => row({ id: 7 }),
      updateBook: async (id: number, d: Record<string, unknown>) => row({ id, ...d }),
    });
    const u = await caller.books.update({ id: 1, status: "available" });
    expect(db.updateBook).toHaveBeenCalledWith(1, { status: "available" });
    expect(u.status).toBe("available");
    await expect(caller.books.update({ id: 1, slug: "derech-haruach" })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      makeCaller(adminCtx(), { updateBook: async () => undefined }).caller.books.update({ id: 42, title: "y" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("reorder forwards the id list", async () => {
    const { caller, db } = makeCaller(adminCtx());
    await caller.books.reorder({ ids: [3, 1, 2] });
    expect(db.reorderBooks).toHaveBeenCalledWith([3, 1, 2]);
  });
});
