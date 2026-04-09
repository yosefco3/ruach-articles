import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("categories", () => {
  it("lists categories publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const categories = await caller.categories.list();
    expect(Array.isArray(categories)).toBe(true);
    // Should have at least the seeded categories
    expect(categories.length).toBeGreaterThanOrEqual(3);
    // Each category should have required fields
    for (const cat of categories) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("slug");
    }
  });

  it("fetches a category by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const cat = await caller.categories.bySlug({ slug: "spirituality" });
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("רוחניות");
    expect(cat?.slug).toBe("spirituality");
  });

  it("returns undefined for non-existent slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const cat = await caller.categories.bySlug({ slug: "nonexistent-category-xyz" });
    expect(cat).toBeUndefined();
  });

  it("prevents non-admin from creating categories", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(
      caller.categories.create({ name: "Test", slug: "test" })
    ).rejects.toThrow();
  });

  it("prevents non-admin from deleting categories", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(
      caller.categories.delete({ id: 1 })
    ).rejects.toThrow();
  });

  it("prevents non-admin from updating categories", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(
      caller.categories.update({ id: 1, name: "Hacked" })
    ).rejects.toThrow();
  });

  it("admin can create, update, and delete a category", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Create
    const created = await caller.categories.create({
      name: "Test Category",
      slug: "test-cat-" + Date.now(),
      description: "A test category",
      color: "#FF0000",
    });
    expect(created).toBeDefined();

    // Get the list to find the new category
    const list = await caller.categories.list();
    const newCat = list.find((c) => c.slug.startsWith("test-cat-"));
    expect(newCat).toBeDefined();

    // Update
    const updateResult = await caller.categories.update({
      id: newCat!.id,
      name: "Updated Test Category",
      color: "#00FF00",
    });
    expect(updateResult).toEqual({ success: true });

    // Delete
    const deleteResult = await caller.categories.delete({ id: newCat!.id });
    expect(deleteResult).toEqual({ success: true });

    // Verify deleted
    const listAfter = await caller.categories.list();
    const found = listAfter.find((c) => c.id === newCat!.id);
    expect(found).toBeUndefined();
  });
});

describe("newsletter", () => {
  const testEmail = `test-${Date.now()}@example.com`;

  it("allows public subscription", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.newsletter.subscribe({
      email: testEmail,
      name: "Test Subscriber",
    });
    expect(result).toEqual({ success: true });
  });

  it("allows public unsubscription", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.newsletter.unsubscribe({ email: testEmail });
    expect(result).toEqual({ success: true });
  });

  it("prevents non-admin from listing subscribers", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(caller.newsletter.list()).rejects.toThrow();
  });

  it("admin can list subscribers", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const subscribers = await caller.newsletter.list();
    expect(Array.isArray(subscribers)).toBe(true);
  });

  it("rejects invalid email format", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.newsletter.subscribe({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});
