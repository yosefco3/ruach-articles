import { describe, it, expect, afterAll } from "vitest";
import { like } from "drizzle-orm";
import { getDb } from "./connection";
import { events } from "../../drizzle/schema";
import { createEvent, getEventBySlug, listEvents, updateEvent, deleteEvent } from "./events";

const P = `__test-event-${Date.now()}`;
afterAll(async () => { const db = await getDb(); if (db) await db.delete(events).where(like(events.slug, "__test-event-%")); });

describe("events db", () => {
  it("creates unpublished by default, lists by start date, publishedOnly filters", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available — is docker compose up?");
    const later = await createEvent({ slug: `${P}-b`, title: "סדנה ב", startsAt: new Date("2027-03-01T18:00:00Z"), published: true });
    const sooner = await createEvent({ slug: `${P}-a`, title: "סדנה א", startsAt: new Date("2027-01-01T18:00:00Z"), published: true });
    const draft = await createEvent({ slug: `${P}-c`, title: "טיוטה", startsAt: new Date("2027-02-01T18:00:00Z") });
    expect(draft).toMatchObject({ published: false, isOnline: false, price: "" });
    const pub = (await listEvents({ publishedOnly: true })).filter((e) => e.slug.startsWith(P));
    expect(pub.map((e) => e.id)).toEqual([sooner.id, later.id]);
    expect((await listEvents()).filter((e) => e.slug.startsWith(P)).length).toBe(3);
    await updateEvent(draft.id, { published: true, isOnline: true });
    expect(await getEventBySlug(`${P}-c`)).toMatchObject({ published: true, isOnline: true });
    await deleteEvent(draft.id);
    expect(await getEventBySlug(`${P}-c`)).toBeUndefined();
  });
});
