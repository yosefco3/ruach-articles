import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";

const post = { title: "T", authorName: "A", authorEmail: "a@x.test", body: "B", category: "c" };

describe("guestPosts.list", () => {
  it("rejects public (UNAUTHORIZED) and regular users (FORBIDDEN)", async () => {
    await expect(makeCaller(publicCtx()).caller.guestPosts.list({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(makeCaller(userCtx()).caller.guestPosts.list({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("admin lists and forwards the status filter", async () => {
    const { caller, db } = makeCaller(adminCtx(), { getGuestPosts: async () => [] });
    await caller.guestPosts.list({ status: "pending" });
    expect(db.getGuestPosts).toHaveBeenCalledWith("pending");
  });
});

describe("guestPosts.submit", () => {
  it("rejects anonymous callers", async () => {
    await expect(makeCaller(publicCtx()).caller.guestPosts.submit(post)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("lets any authenticated user submit", async () => {
    const { caller, db } = makeCaller(userCtx(), { createGuestPost: async () => ({ success: true }) });
    await expect(caller.guestPosts.submit(post)).resolves.toEqual({ success: true });
    expect(db.createGuestPost).toHaveBeenCalledWith(post);
  });
});

describe("guestPosts moderation (admin-only)", () => {
  it("approve sets status approved", async () => {
    const { caller, db } = makeCaller(adminCtx());
    await expect(caller.guestPosts.approve({ id: 5 })).resolves.toEqual({ success: true });
    expect(db.updateGuestPostStatus).toHaveBeenCalledWith(5, "approved");
  });

  it("reject sets status rejected", async () => {
    const { caller, db } = makeCaller(adminCtx());
    await caller.guestPosts.reject({ id: 5 });
    expect(db.updateGuestPostStatus).toHaveBeenCalledWith(5, "rejected");
  });

  it("delete removes the post and is forbidden for regular users", async () => {
    await expect(makeCaller(userCtx()).caller.guestPosts.delete({ id: 5 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const { caller, db } = makeCaller(adminCtx());
    await caller.guestPosts.delete({ id: 5 });
    expect(db.deleteGuestPost).toHaveBeenCalledWith(5);
  });
});
