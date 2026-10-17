import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";

describe("about router", () => {
  it("get is public", async () => {
    const { caller, db } = makeCaller(publicCtx(), {
      getAboutPage: async () => ({ title: "About", content: "x", imageUrl: null }),
    });
    await expect(caller.about.get()).resolves.toMatchObject({ title: "About" });
    expect(db.getAboutPage).toHaveBeenCalled();
  });

  it("update is admin-only and defaults imageUrl to null", async () => {
    await expect(
      makeCaller(userCtx()).caller.about.update({ title: "a", content: "b" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const { caller, db } = makeCaller(adminCtx(), {
      getAboutPage: async () => ({ title: "a", content: "b", imageUrl: null }),
    });
    await caller.about.update({ title: "a", content: "b" });
    expect(db.updateAboutPage).toHaveBeenCalledWith({ title: "a", content: "b", imageUrl: null });
  });
});

describe("users router", () => {
  it("list is admin-only", async () => {
    await expect(makeCaller(publicCtx()).caller.users.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(makeCaller(userCtx()).caller.users.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const { caller, db } = makeCaller(adminCtx(), { getAllUsers: async () => [] });
    await expect(caller.users.list()).resolves.toEqual([]);
    expect(db.getAllUsers).toHaveBeenCalled();
  });
});

