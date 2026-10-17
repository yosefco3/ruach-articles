import { describe, it, expect } from "vitest";
import { makeCaller, publicCtx, userCtx, adminCtx } from "../test-helpers/trpc";

const ev = (o: Record<string, unknown> = {}) => ({
  id: 1, slug: "sadna", title: "סדנה", description: null, startsAt: new Date(Date.now() + 86_400_000), endsAt: null,
  location: "ירושלים", isOnline: false, registrationUrl: "", price: "", teacherId: null, bookId: null, coverImage: null,
  published: true, createdAt: new Date(), updatedAt: new Date(), ...o,
});
const settings = (eventsVisible: boolean) => ({ siteTitle: "דרך הרוח", heroSubtitle: "", contactEmail: null, eventsVisible });

describe("events router (hidden infrastructure)", () => {
  it("list: section off → visible:false and empty, without touching the events table", async () => {
    const { caller, db } = makeCaller(publicCtx(), { getSiteSettings: async () => settings(false) });
    expect(await caller.events.list()).toEqual({ visible: false, upcoming: [], past: [] });
    expect(db.listEvents).not.toHaveBeenCalled();
  });

  it("list: section on → published events split into upcoming/past", async () => {
    const past = ev({ id: 2, slug: "old", startsAt: new Date(Date.now() - 86_400_000) });
    const { caller } = makeCaller(publicCtx(), { getSiteSettings: async () => settings(true), listEvents: async () => [past, ev()] });
    const r = await caller.events.list();
    expect(r.visible).toBe(true);
    expect(r.upcoming.map((e) => e.slug)).toEqual(["sadna"]);
    expect(r.past.map((e) => e.slug)).toEqual(["old"]);
  });

  it("bySlug: NOT_FOUND for visitors when the section is off or the event is a draft; admin previews", async () => {
    await expect(makeCaller(publicCtx(), { getSiteSettings: async () => settings(false), getEventBySlug: async () => ev() }).caller.events.bySlug({ slug: "sadna" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(makeCaller(userCtx(), { getSiteSettings: async () => settings(true), getEventBySlug: async () => ev({ published: false }) }).caller.events.bySlug({ slug: "sadna" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(makeCaller(adminCtx(), { getSiteSettings: async () => settings(false), getEventBySlug: async () => ev({ published: false }) }).caller.events.bySlug({ slug: "sadna" }))
      .resolves.toMatchObject({ slug: "sadna" });
    await expect(makeCaller(publicCtx(), { getSiteSettings: async () => settings(true), getEventBySlug: async () => ev() }).caller.events.bySlug({ slug: "sadna" }))
      .resolves.toMatchObject({ slug: "sadna" });
  });

  it("admin CRUD: dates coerced, duplicate slug rejected, non-admin forbidden", async () => {
    await expect(makeCaller(userCtx()).caller.events.create({ slug: "x", title: "x", startsAt: new Date() })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const { caller, db } = makeCaller(adminCtx(), { getEventBySlug: async () => undefined, createEvent: async (d: Record<string, unknown>) => ev(d) });
    await caller.events.create({ slug: "sadna", title: "סדנה", startsAt: "2027-01-01T18:00:00.000Z" as unknown as Date, isOnline: true });
    expect(db.createEvent.mock.calls[0][0].startsAt).toBeInstanceOf(Date);
    await expect(makeCaller(adminCtx(), { getEventBySlug: async () => ev() }).caller.events.create({ slug: "sadna", title: "x", startsAt: new Date() }))
      .rejects.toMatchObject({ code: "CONFLICT" });
    await expect(caller.events.create({ slug: "y", title: "y", startsAt: new Date(), registrationUrl: "nope" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
