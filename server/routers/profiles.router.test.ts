import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx } from "../test-helpers/trpc";

describe("profiles.get", () => {
  it("returns both the profile and the comment count", async () => {
    const { caller } = makeCaller(publicCtx(), {
      getUserProfile: async () => ({ userId: 4, bio: "hello" }),
      getUserCommentCount: async () => 7,
    });
    await expect(caller.profiles.get({ userId: 4 })).resolves.toEqual({
      profile: { userId: 4, bio: "hello" },
      commentCount: 7,
    });
  });
});

describe("profiles.update upsert", () => {
  it("rejects anonymous callers", async () => {
    await expect(
      makeCaller(publicCtx()).caller.profiles.update({ bio: "x" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates a profile when none exists", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 8 }), { getUserProfile: async () => null });
    await caller.profiles.update({ bio: "hi" });
    expect(db.createUserProfile).toHaveBeenCalledWith({ userId: 8, bio: "hi" });
    expect(db.updateUserProfile).not.toHaveBeenCalled();
  });

  it("updates the existing profile otherwise", async () => {
    const { caller, db } = makeCaller(userCtx({ dbId: 8 }), {
      getUserProfile: async () => ({ userId: 8, bio: "old" }),
    });
    await caller.profiles.update({ bio: "new" });
    expect(db.updateUserProfile).toHaveBeenCalledWith(8, { bio: "new" });
    expect(db.createUserProfile).not.toHaveBeenCalled();
  });
});
