import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the storage module so the test never touches a real disk/R2 — we only assert that
// the DB delete paths ask storage to remove the right files.
const deleteObject = vi.fn(async () => true);
vi.mock("../storage", () => ({ deleteObject }));

const { getDb } = await import("./connection");
const { createAttachment, deleteAttachment } = await import("./attachments");
const { createArticle, deleteArticle } = await import("./articles");
const { attachments } = await import("../../drizzle/schema");
const { eq } = await import("drizzle-orm");

beforeEach(() => deleteObject.mockClear());

describe("deleteAttachment", () => {
  it("removes the row AND deletes the underlying file", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available — is docker compose up?");

    const fileUrl = `/uploads/attachments/del-${Date.now()}.jpg`;
    await createAttachment({ articleId: 999999, fileName: "t.jpg", fileUrl, fileSize: 10 });
    const [row] = await db.select().from(attachments).where(eq(attachments.fileUrl, fileUrl));
    expect(row).toBeTruthy();

    await deleteAttachment(row.id);

    const after = await db.select().from(attachments).where(eq(attachments.id, row.id));
    expect(after.length).toBe(0);
    expect(deleteObject).toHaveBeenCalledWith(fileUrl);
  });
});

describe("deleteArticle", () => {
  it("deletes attachment files and the cover image", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available — is docker compose up?");

    const stamp = Date.now();
    const coverImage = `/uploads/attachments/cover-${stamp}.jpg`;
    const attUrl = `/uploads/attachments/att-${stamp}.jpg`;

    const article = (await createArticle({
      title: "del-test",
      slug: `del-test-${stamp}`,
      body: "b",
      category: "c",
      authorId: 1,
      published: false,
      coverImage,
    })) as { id: number };

    await createAttachment({ articleId: article.id, fileName: "a.jpg", fileUrl: attUrl, fileSize: 5 });

    await deleteArticle(article.id);

    expect(deleteObject).toHaveBeenCalledWith(attUrl);
    expect(deleteObject).toHaveBeenCalledWith(coverImage);
  });
});
