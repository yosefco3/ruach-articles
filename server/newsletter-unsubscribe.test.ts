import { describe, expect, it } from "vitest";
import { makeCaller, publicCtx } from "./test-helpers/trpc";

// The unsubscribe link in every email is public, so the mutation must answer the
// same way for known and unknown addresses (no "email not found" leak).

function store() {
  const subs = [{ email: "known@example.com", active: true }];
  return {
    subs,
    unsubscribeFromNewsletter: async (email: string) => {
      const s = subs.find((x) => x.email === email);
      if (s) s.active = false;
    },
  };
}

describe("newsletter.unsubscribe", () => {
  it("succeeds silently for an unknown email", async () => {
    const db = store();
    const { caller } = makeCaller(publicCtx(), db);
    await expect(caller.newsletter.unsubscribe({ email: "nobody@example.com" })).resolves.toEqual({ success: true });
    expect(db.subs[0].active).toBe(true);
  });

  it("deactivates a known email with the same response", async () => {
    const db = store();
    const { caller } = makeCaller(publicCtx(), db);
    await expect(caller.newsletter.unsubscribe({ email: "known@example.com" })).resolves.toEqual({ success: true });
    expect(db.subs[0].active).toBe(false);
  });

  it("still rejects a malformed address", async () => {
    const { caller } = makeCaller(publicCtx(), store());
    await expect(caller.newsletter.unsubscribe({ email: "nope" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
