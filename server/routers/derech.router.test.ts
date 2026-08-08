import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";
import { DEFAULT_DERECH_CONTENT } from "@shared/derech";

describe("derech router", () => {
  it("get is public and returns the stored content", async () => {
    const { caller, db } = makeCaller(publicCtx(), {
      getDerechContent: async () => DEFAULT_DERECH_CONTENT,
    });
    await expect(caller.derech.get()).resolves.toMatchObject({ title: "דרך הרוח" });
    expect(db.getDerechContent).toHaveBeenCalled();
  });

  it("get returns null when nothing is stored (client falls back to default)", async () => {
    const { caller } = makeCaller(publicCtx(), {
      getDerechContent: async () => null,
    });
    await expect(caller.derech.get()).resolves.toBeNull();
  });

  it("update is admin-only", async () => {
    await expect(
      makeCaller(userCtx()).caller.derech.update(DEFAULT_DERECH_CONTENT),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      makeCaller(publicCtx()).caller.derech.update(DEFAULT_DERECH_CONTENT),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("update validates and stores the full content shape", async () => {
    const { caller, db } = makeCaller(adminCtx(), {
      getDerechContent: async () => DEFAULT_DERECH_CONTENT,
    });
    await caller.derech.update(DEFAULT_DERECH_CONTENT);
    expect(db.updateDerechContent).toHaveBeenCalledWith(
      expect.objectContaining({ title: "דרך הרוח" }),
    );
  });

  it("update rejects malformed content (empty principle title)", async () => {
    const bad = {
      ...DEFAULT_DERECH_CONTENT,
      principles: [{ title: "", law: "x", body: "y" }],
    };
    await expect(makeCaller(adminCtx()).caller.derech.update(bad)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
