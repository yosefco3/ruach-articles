import { describe, it, expect } from "vitest";
import { kindOfRow, bookFieldsForSubmit, bookBadge } from "./articleKind";

const books = [{ id: 3, slug: "derech-haruach", title: "דרך הרוח" }];

describe("articleKind", () => {
  it("kindOfRow", () => {
    expect(kindOfRow({ bookId: null })).toBe("article");
    expect(kindOfRow({ bookId: 3, bookRole: "chapter" })).toBe("chapter");
    expect(kindOfRow({ bookId: 3, bookRole: "material" })).toBe("material");
  });

  it("bookFieldsForSubmit: article keeps its category and detaches from any book", () => {
    expect(bookFieldsForSubmit("article", { category: "", bookId: 3, chapterNo: "1", chapterLabel: "x" }, books)).toEqual({ error: "יש לבחור קטגוריה" });
    expect(bookFieldsForSubmit("article", { category: "c", bookId: 3, chapterNo: "1", chapterLabel: "x" }, books))
      .toEqual({ category: "c", bookId: null, bookRole: "chapter", chapterNo: null, chapterLabel: "" });
  });

  it("bookFieldsForSubmit: chapter/material take the book's slug as category", () => {
    expect(bookFieldsForSubmit("chapter", { category: "c", bookId: 9, chapterNo: "1", chapterLabel: "" }, books)).toEqual({ error: "יש לבחור ספר" });
    expect(bookFieldsForSubmit("material", { category: "c", bookId: 3, chapterNo: "abc", chapterLabel: " תרגיל " }, books))
      .toEqual({ category: "derech-haruach", bookId: 3, bookRole: "material", chapterNo: null, chapterLabel: "תרגיל" });
    expect(bookFieldsForSubmit("chapter", { category: "", bookId: 3, chapterNo: "2", chapterLabel: "פרק 2" }, books))
      .toMatchObject({ bookRole: "chapter", chapterNo: 2 });
  });

  it("bookBadge", () => {
    expect(bookBadge({ bookId: null }, books)).toBeNull();
    expect(bookBadge({ bookId: 3, bookRole: "chapter", chapterLabel: "פרק 2" }, books)).toBe("דרך הרוח · פרק 2");
    expect(bookBadge({ bookId: 3, bookRole: "material", chapterLabel: "" }, books)).toBe("דרך הרוח · חומר עזר");
    expect(bookBadge({ bookId: 8, bookRole: "chapter" }, books)).toBe("ספר #8 · פרק");
  });
});
