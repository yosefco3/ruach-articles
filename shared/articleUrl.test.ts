import { describe, it, expect } from "vitest";
import { articlePath } from "./articleUrl";

describe("articlePath", () => {
  it("plain article → /article/<slug>", () => {
    expect(articlePath({ slug: "a b" })).toBe("/article/a%20b");
    expect(articlePath({ slug: "x", bookId: null })).toBe("/article/x");
  });
  it("book-attached → under the book; hidden book → null", () => {
    expect(articlePath({ slug: "mavo", bookId: 5, bookSlug: "derech-haruach", bookVisible: true })).toBe("/book/derech-haruach/mavo");
    expect(articlePath({ slug: "mavo", bookId: 5, bookSlug: "derech-haruach", bookVisible: false })).toBeNull();
    expect(articlePath({ slug: "mavo", bookId: 5 })).toBeNull();
  });
});
