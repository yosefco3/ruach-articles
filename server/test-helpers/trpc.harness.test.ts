import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, adminCtx, userCtx } from "./trpc";

describe("trpc test harness", () => {
  it("auto-mocks db methods and returns overrides", async () => {
    const { caller, db } = makeCaller(publicCtx(), { getCategories: async () => [{ id: 1 }] });
    const cats = await caller.categories.list();
    expect(cats).toEqual([{ id: 1 }]);
    expect(db.getCategories).toHaveBeenCalledOnce();
  });

  it("admin routes reject a public caller with UNAUTHORIZED (login required first)", async () => {
    // categories.listAll uses middleware.adminProcedure = protectedProcedure + admin
    // check, so an anonymous caller is stopped at the auth gate, not the role gate.
    const { caller } = makeCaller(publicCtx());
    await expect(caller.categories.listAll()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("adminProcedure rejects a regular user but allows admin", async () => {
    await expect(makeCaller(userCtx()).caller.categories.listAll()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const { caller, db } = makeCaller(adminCtx(), { getAllCategories: async () => [] });
    await expect(caller.categories.listAll()).resolves.toEqual([]);
    expect(db.getAllCategories).toHaveBeenCalled();
  });
});
