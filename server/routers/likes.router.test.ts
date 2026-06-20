import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx } from "../test-helpers/trpc";

describe("likes.toggle", () => {
  it("rejects anonymous callers", async () => {
    await expect(
      makeCaller(publicCtx()).caller.likes.toggle({ articleId: 1 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("removes an existing like and reports liked:false", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 3 }), {
      getUserLike: async () => ({ id: 42 }),
    });
    await expect(caller.likes.toggle({ articleId: 1 })).resolves.toEqual({ liked: false });
    expect(db.deleteLike).toHaveBeenCalledWith(42);
    expect(db.createLike).not.toHaveBeenCalled();
  });

  it("creates a like for the caller and reports liked:true", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 3 }), {
      getUserLike: async () => null,
    });
    await expect(caller.likes.toggle({ articleId: 1 })).resolves.toEqual({ liked: true });
    expect(db.createLike.mock.calls[0][0]).toMatchObject({ userId: 3, articleId: 1 });
    expect(db.deleteLike).not.toHaveBeenCalled();
  });
});

describe("likes.count", () => {
  it("is public and forwards both ids", async () => {
    const { caller, db } = makeCaller(publicCtx(), { getLikeCount: async () => 5 });
    await expect(caller.likes.count({ commentId: 8 })).resolves.toBe(5);
    expect(db.getLikeCount).toHaveBeenCalledWith(undefined, 8);
  });
});
