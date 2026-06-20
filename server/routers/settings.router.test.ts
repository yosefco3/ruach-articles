import { describe, it, expect } from "vitest";
import { makeCaller, adminCtx } from "../test-helpers/trpc";

describe("settings.update", () => {
  it("persists the input then returns the refreshed settings", async () => {
    const saved = { siteTitle: "Ruach", heroSubtitle: "sub", contactEmail: "c@x.test" };
    const { caller, db } = makeCaller(adminCtx(), { getSiteSettings: async () => saved });
    const result = await caller.settings.update({ siteTitle: "Ruach", contactEmail: "c@x.test" });
    expect(db.updateSiteSettings).toHaveBeenCalledWith({ siteTitle: "Ruach", contactEmail: "c@x.test" });
    expect(result).toEqual(saved);
  });

  it("accepts an empty string to clear the contact email", async () => {
    const { caller, db } = makeCaller(adminCtx(), { getSiteSettings: async () => ({}) });
    await expect(caller.settings.update({ contactEmail: "" })).resolves.toBeDefined();
    expect(db.updateSiteSettings).toHaveBeenCalledWith({ contactEmail: "" });
  });
});
