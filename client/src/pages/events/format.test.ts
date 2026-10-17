import { describe, it, expect } from "vitest";
import { formatEventWhere, fromLocalInput, toLocalInput, formatEventWhen } from "./format";

describe("event formatting", () => {
  it("where: online vs. place", () => {
    expect(formatEventWhere({ isOnline: true, location: "" })).toBe("אונליין");
    expect(formatEventWhere({ isOnline: true, location: "זום" })).toBe("אונליין · זום");
    expect(formatEventWhere({ isOnline: false, location: "" })).toBe("המקום יפורסם");
    expect(formatEventWhere({ isOnline: false, location: "ירושלים" })).toBe("ירושלים");
  });
  it("datetime-local round trip", () => {
    const d = fromLocalInput("2027-01-05T18:30");
    expect(d).toBeInstanceOf(Date);
    expect(toLocalInput(d!)).toBe("2027-01-05T18:30");
    expect(fromLocalInput("")).toBeNull();
    expect(toLocalInput(null)).toBe("");
  });
  it("when: same-day range shows one date", () => {
    const s = new Date(2027, 0, 5, 18, 0); const e = new Date(2027, 0, 5, 20, 0);
    const txt = formatEventWhen(s, e);
    expect(txt).toContain("2027");
    expect((txt.match(/2027/g) ?? []).length).toBe(1);
    expect(formatEventWhen(s)).not.toContain("–");
  });
});
