import { describe, it, expect } from "vitest";
import { canEditArticle, isAdmin } from "./articlePermissions";

const admin = { role: "admin", dbId: 99 };
const author = { role: "user", dbId: 7 };

describe("canEditArticle", () => {
  it("lets an admin edit any article", () => {
    expect(canEditArticle(admin, { authorId: 7 })).toBe(true);
  });

  it("lets the author edit their own article", () => {
    expect(canEditArticle(author, { authorId: 7 })).toBe(true);
  });

  it("refuses another user's article", () => {
    expect(canEditArticle(author, { authorId: 8 })).toBe(false);
  });

  it("refuses anonymous visitors and missing data", () => {
    expect(canEditArticle(null, { authorId: 7 })).toBe(false);
    expect(canEditArticle(author, null)).toBe(false);
    expect(canEditArticle(author, { authorId: null })).toBe(false);
  });

  it("does not treat a missing dbId as a match for a missing authorId", () => {
    expect(canEditArticle({ role: "user" }, { authorId: null })).toBe(false);
  });
});

describe("isAdmin", () => {
  it("is true only for the admin role", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(author)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});
