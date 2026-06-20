import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";

describe("comments.list", () => {
  it("forwards the articleId to the db", async () => {
    const { caller, db } = makeCaller(publicCtx(), { getCommentsByArticle: async () => [] });
    await caller.comments.list({ articleId: 12 });
    expect(db.getCommentsByArticle).toHaveBeenCalledWith(12);
  });
});

describe("comments.create", () => {
  it("rejects anonymous callers", async () => {
    await expect(
      makeCaller(publicCtx()).caller.comments.create({ articleId: 1, body: "hi" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates the comment authored by the caller's dbId", async () => {
    const created = { id: 1, body: "hi" };
    const { caller, db } = makeCaller(userCtx({ dbId: 5 }), {
      createComment: async () => created,
      // Short-circuit the notification path: no article -> no email.
      getArticleById: async () => null,
    });
    const result = await caller.comments.create({ articleId: 9, body: "hi" });
    expect(result).toEqual(created);
    expect(db.createComment.mock.calls[0][0]).toMatchObject({ articleId: 9, userId: 5, body: "hi" });
  });

  it("still succeeds when the notification path throws (best-effort)", async () => {
    const created = { id: 2, body: "yo" };
    const { caller, db } = makeCaller(userCtx(), {
      createComment: async () => created,
      // Notification lookups blow up — must be swallowed, comment must persist.
      getArticleById: async () => {
        throw new Error("db down");
      },
    });
    await expect(caller.comments.create({ articleId: 1, body: "yo" })).resolves.toEqual(created);
    expect(db.createComment).toHaveBeenCalledOnce();
  });
});

describe("comments.delete guard", () => {
  it("throws NOT_FOUND when the comment is missing", async () => {
    const { caller } = makeCaller(userCtx(), { getCommentById: async () => null });
    await expect(caller.comments.delete({ id: 1 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("forbids deleting another user's comment", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 5 }), {
      getCommentById: async () => ({ id: 1, userId: 999 }),
    });
    await expect(caller.comments.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.deleteComment).not.toHaveBeenCalled();
  });

  it("lets the owner delete their own comment", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 5 }), {
      getCommentById: async () => ({ id: 1, userId: 5 }),
    });
    await expect(caller.comments.delete({ id: 1 })).resolves.toEqual({ success: true });
    expect(db.deleteComment).toHaveBeenCalledWith(1);
  });

  it("lets an admin delete anyone's comment", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getCommentById: async () => ({ id: 1, userId: 999 }),
    });
    await expect(caller.comments.delete({ id: 1 })).resolves.toEqual({ success: true });
    expect(db.deleteComment).toHaveBeenCalledWith(1);
  });
});
