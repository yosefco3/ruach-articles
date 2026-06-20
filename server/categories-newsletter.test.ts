import { describe, expect, it } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "./test-helpers/trpc";

// Both routers under test (categories, newsletter) are deps-factories, so we inject a
// fake db via the shared harness — no vi.mock, and the contexts use the real AuthUser
// shape (incl. dbId). Stateful overrides back the CRUD round-trip.

const seedCategories = [
  { id: 1, name: "ריפוי", slug: "healing", description: null, color: null, createdAt: new Date() },
  { id: 2, name: 'רמב"ם', slug: "רמבם", description: null, color: null, createdAt: new Date() },
  { id: 3, name: "כללי", slug: "כללי", description: null, color: null, createdAt: new Date() },
];

/** In-memory categories store so create/update/delete round-trip on one caller. */
function catStore() {
  let cats = seedCategories.map((c) => ({ ...c }));
  let nextId = 10;
  return {
    getCategories: async () => cats.map((c) => ({ ...c })),
    getCategoryBySlug: async (slug: string) => cats.find((c) => c.slug === slug),
    createCategory: async (d: Record<string, unknown>) => {
      const c = { id: nextId++, description: null, color: null, createdAt: new Date(), ...d } as (typeof cats)[number];
      cats.push(c);
      return c;
    },
    updateCategory: async (id: number, d: Record<string, unknown>) => {
      cats = cats.map((c) => (c.id === id ? { ...c, ...d } : c));
      return { success: true };
    },
    deleteCategory: async (id: number) => {
      cats = cats.filter((c) => c.id !== id);
      return { success: true };
    },
  };
}

describe("categories", () => {
  it("lists categories publicly", async () => {
    const { caller } = makeCaller(publicCtx(), catStore());
    const categories = await caller.categories.list();
    expect(categories.length).toBeGreaterThanOrEqual(3);
    for (const cat of categories) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("slug");
    }
  });

  it("fetches a category by slug", async () => {
    const { caller } = makeCaller(publicCtx(), catStore());
    const cat = await caller.categories.bySlug({ slug: "healing" });
    expect(cat?.slug).toBe("healing");
    expect(cat?.name).toBe("ריפוי");
  });

  it("returns undefined for a non-existent slug", async () => {
    const { caller } = makeCaller(publicCtx(), catStore());
    expect(await caller.categories.bySlug({ slug: "nonexistent-xyz" })).toBeUndefined();
  });

  it("prevents non-admins from creating, updating, or deleting", async () => {
    const { caller } = makeCaller(userCtx(), catStore());
    await expect(caller.categories.create({ name: "Test", slug: "test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.categories.update({ id: 1, name: "Hacked" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.categories.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lets an admin create, update, and delete a category", async () => {
    const { caller } = makeCaller(adminCtx(), catStore());

    await caller.categories.create({ name: "Test Category", slug: "test-cat", description: "d", color: "#FF0000" });
    const created = (await caller.categories.list()).find((c) => c.slug === "test-cat");
    expect(created).toBeDefined();

    expect(await caller.categories.update({ id: created!.id, name: "Updated", color: "#00FF00" })).toEqual({ success: true });
    expect(await caller.categories.delete({ id: created!.id })).toEqual({ success: true });

    const after = (await caller.categories.list()).find((c) => c.id === created!.id);
    expect(after).toBeUndefined();
  });
});

/** In-memory newsletter subscriber store. */
function subStore() {
  const subs: { email: string; name?: string }[] = [];
  return {
    subscribeToNewsletter: async (d: { email: string; name?: string }) => {
      subs.push(d);
    },
    unsubscribeFromNewsletter: async (email: string) => {
      const i = subs.findIndex((s) => s.email === email);
      if (i !== -1) subs.splice(i, 1);
    },
    getNewsletterSubscribers: async () => [...subs],
  };
}

describe("newsletter", () => {
  const testEmail = "test-mock@example.com";

  it("allows public subscription", async () => {
    const { caller } = makeCaller(publicCtx(), subStore());
    await expect(caller.newsletter.subscribe({ email: testEmail, name: "Test" })).resolves.toEqual({ success: true });
  });

  it("allows public unsubscription", async () => {
    const { caller } = makeCaller(publicCtx(), subStore());
    await expect(caller.newsletter.unsubscribe({ email: testEmail })).resolves.toEqual({ success: true });
  });

  it("prevents non-admins from listing subscribers", async () => {
    const { caller } = makeCaller(userCtx(), subStore());
    await expect(caller.newsletter.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lets an admin list subscribers", async () => {
    const { caller } = makeCaller(adminCtx(), subStore());
    expect(Array.isArray(await caller.newsletter.list())).toBe(true);
  });

  it("rejects an invalid email format", async () => {
    const { caller } = makeCaller(publicCtx(), subStore());
    await expect(caller.newsletter.subscribe({ email: "not-an-email" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
