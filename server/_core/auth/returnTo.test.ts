import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./returnTo";

describe("safeReturnTo", () => {
  it("מאשר נתיב פנימי", () => {
    expect(safeReturnTo("/tarot")).toBe("/tarot");
    expect(safeReturnTo("/iching")).toBe("/iching");
    expect(safeReturnTo("/tarot?x=1")).toBe("/tarot?x=1");
  });

  it("דוחה open-redirect וקלט לא תקין", () => {
    expect(safeReturnTo("//evil.com")).toBeNull();
    expect(safeReturnTo("/\\evil.com")).toBeNull();
    expect(safeReturnTo("https://evil.com")).toBeNull();
    expect(safeReturnTo("tarot")).toBeNull();
    expect(safeReturnTo("")).toBeNull();
    expect(safeReturnTo(undefined)).toBeNull();
    expect(safeReturnTo(["/a", "/b"])).toBeNull();
    expect(safeReturnTo("/" + "x".repeat(600))).toBeNull();
  });
});
