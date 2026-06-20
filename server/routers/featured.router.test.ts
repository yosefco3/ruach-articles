import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";

describe("featured.get", () => {
  it("is public and returns the featured article", async () => {
    const { caller, db } = makeCaller(publicCtx(), {
      getFeaturedArticle: async () => ({ id: 1, title: "Hero" }),
    });
    await expect(caller.featured.get()).resolves.toEqual({ id: 1, title: "Hero" });
    expect(db.getFeaturedArticle).toHaveBeenCalledOnce();
  });
});

describe("featured.set", () => {
  it("rejects public (UNAUTHORIZED) and regular users (FORBIDDEN)", async () => {
    await expect(makeCaller(publicCtx()).caller.featured.set({ articleId: 2 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(makeCaller(userCtx()).caller.featured.set({ articleId: 2 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("lets an admin set the featured article", async () => {
    const { caller, db } = makeCaller(adminCtx());
    await expect(caller.featured.set({ articleId: 2 })).resolves.toEqual({ success: true });
    expect(db.setFeaturedArticle).toHaveBeenCalledWith(2);
  });
});
