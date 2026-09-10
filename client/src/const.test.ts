/** בדיקות ל-getLoginUrl — חזרה לדף הנוכחי כברירת מחדל אחרי התחברות. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLoginUrl } from "./const";

afterEach(() => vi.unstubAllGlobals());

describe("getLoginUrl", () => {
  it("ברירת מחדל בדפדפן: הנתיב הנוכחי כולל query", () => {
    vi.stubGlobal("window", { location: { pathname: "/articles/foo", search: "?p=2" } });
    expect(getLoginUrl()).toBe(`/api/auth/google?returnTo=${encodeURIComponent("/articles/foo?p=2")}`);
  });

  it("returnTo מפורש גובר על הנתיב הנוכחי", () => {
    vi.stubGlobal("window", { location: { pathname: "/somewhere", search: "" } });
    expect(getLoginUrl("/tarot")).toBe("/api/auth/google?returnTo=%2Ftarot");
  });

  it("ללא window (SSR): כתובת בסיס בלי returnTo", () => {
    expect(getLoginUrl()).toBe("/api/auth/google");
  });
});
