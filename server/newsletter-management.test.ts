import { describe, it, expect, beforeEach } from "vitest";
import {
  subscribeToNewsletter,
  getNewsletterSubscribers,
  deleteNewsletterSubscriber,
  searchNewsletterSubscribers,
  unsubscribeFromNewsletter,
} from "./db";

describe("Newsletter management", () => {
  const testEmail1 = `test-mgmt-${Date.now()}@example.com`;
  const testEmail2 = `test-search-${Date.now()}@example.com`;

  beforeEach(async () => {
    // Subscribe two test emails
    await subscribeToNewsletter({ email: testEmail1, name: "Test User 1" });
    await subscribeToNewsletter({ email: testEmail2, name: "Test User 2" });
  });

  it("getNewsletterSubscribers returns all subscribers", async () => {
    const all = await getNewsletterSubscribers();
    expect(Array.isArray(all)).toBe(true);
    const emails = all.map((s) => s.email);
    expect(emails).toContain(testEmail1);
    expect(emails).toContain(testEmail2);
  });

  it("searchNewsletterSubscribers filters by email substring", async () => {
    const results = await searchNewsletterSubscribers("test-search");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((s) => s.email.includes("test-search"))).toBe(true);
  });

  it("deleteNewsletterSubscriber removes the subscriber", async () => {
    const all = await getNewsletterSubscribers();
    const target = all.find((s) => s.email === testEmail1);
    expect(target).toBeDefined();

    await deleteNewsletterSubscriber(target!.id);

    const after = await getNewsletterSubscribers();
    const emails = after.map((s) => s.email);
    expect(emails).not.toContain(testEmail1);
  });

  it("unsubscribeFromNewsletter marks subscriber as inactive", async () => {
    await unsubscribeFromNewsletter(testEmail2);
    const all = await getNewsletterSubscribers();
    const sub = all.find((s) => s.email === testEmail2);
    expect(sub).toBeDefined();
    expect(sub!.active).toBe(false);
  });
});
