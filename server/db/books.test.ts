import { describe, it, expect, afterAll } from "vitest";
import { getDb } from "./connection";
import {
  listBooks, getBookBySlug, createBook, updateBook, deleteBook, reorderBooks,
} from "./books";
import { books } from "../../drizzle/schema";
import { like } from "drizzle-orm";

// בדיקה מול ה-MySQL האמיתי (docker compose up) — כמו attachments.delete.test.ts.
const P = `__test-book-${Date.now()}`;

afterAll(async () => {
  const db = await getDb();
  if (db) await db.delete(books).where(like(books.slug, "__test-book-%"));
});

describe("books db", () => {
  it("creates with defaults (hidden, writing) and reads back by slug", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available — is docker compose up?");
    const b = await createBook({ slug: `${P}-a`, title: "ספר א" });
    expect(b).toMatchObject({ slug: `${P}-a`, title: "ספר א", status: "writing", visible: false, subtitle: "" });
    expect(await getBookBySlug(`${P}-a`)).toMatchObject({ id: b.id });
  });

  it("visibleOnly hides unpublished books; order follows sortOrder", async () => {
    const a = await createBook({ slug: `${P}-b`, title: "ב", visible: true, sortOrder: 5 });
    const c = await createBook({ slug: `${P}-c`, title: "ג", visible: true, sortOrder: 1 });
    const hidden = await createBook({ slug: `${P}-d`, title: "ד", visible: false });
    const vis = (await listBooks({ visibleOnly: true })).filter((r) => r.slug.startsWith(P));
    expect(vis.map((r) => r.id)).toEqual([c.id, a.id]);
    const all = (await listBooks()).filter((r) => r.slug.startsWith(P));
    expect(all.map((r) => r.id)).toContain(hidden.id);

    await reorderBooks([a.id, c.id]);
    const after = (await listBooks({ visibleOnly: true })).filter((r) => r.slug.startsWith(P));
    expect(after.map((r) => r.id)).toEqual([a.id, c.id]);
  });

  it("updates status/links and deletes", async () => {
    const b = await createBook({ slug: `${P}-e`, title: "ה" });
    const u = await updateBook(b.id, { status: "available", purchaseLinks: '[{"label":"x","url":"https://a.b","kind":"print"}]' });
    expect(u).toMatchObject({ status: "available" });
    expect(u?.purchaseLinks).toContain("https://a.b");
    await deleteBook(b.id);
    expect(await getBookBySlug(`${P}-e`)).toBeUndefined();
  });

  it("rejects a duplicate slug", async () => {
    await createBook({ slug: `${P}-f`, title: "ו" });
    await expect(createBook({ slug: `${P}-f`, title: "ו2" })).rejects.toThrow();
  });
});
