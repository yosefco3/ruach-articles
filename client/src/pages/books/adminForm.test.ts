import { describe, it, expect } from "vitest";
import { EMPTY_BOOK_FORM, bookToForm, formToInput, slugifyTitle } from "./adminForm";

describe("admin book form", () => {
  it("slugifyTitle: hebrew/latin, strips quotes, collapses separators", () => {
    expect(slugifyTitle("דרך הרוח — הנבואה הטבעית")).toBe("דרך-הרוח-הנבואה-הטבעית");
    expect(slugifyTitle('  "Derech HaRuach" (2026)!')).toBe("derech-haruach-2026");
  });

  it("formToInput validates and normalizes", () => {
    expect(formToInput({ ...EMPTY_BOOK_FORM })).toEqual({ error: "נדרשת כותרת" });
    expect(formToInput({ ...EMPTY_BOOK_FORM, title: "x", slug: "has space" })).toEqual({ error: "slug: אותיות, ספרות ומקפים בלבד" });
    expect(formToInput({ ...EMPTY_BOOK_FORM, title: "x", purchaseLinks: [{ label: "a", url: "ftp://no", kind: "print" }] }))
      .toMatchObject({ error: expect.stringContaining("כתובת לא תקינה") });

    const r = formToInput({
      ...EMPTY_BOOK_FORM, title: " דרך הרוח ", subtitle: " הנבואה הטבעית ", tocText: "שער א\n\n שער ב ",
      year: "2027", pages: "abc", purchaseLinks: [{ label: " בוקפוד ", url: " https://b.co.il/x ", kind: "print" }],
    });
    expect(r).toEqual({ input: expect.objectContaining({
      slug: "דרך-הרוח", title: "דרך הרוח", subtitle: "הנבואה הטבעית", coverImage: null,
      toc: ["שער א", "שער ב"], year: 2027, pages: null,
      purchaseLinks: [{ label: "בוקפוד", url: "https://b.co.il/x", kind: "print" }],
    }) });
  });

  it("bookToForm round-trips a server row", () => {
    const f = bookToForm({
      slug: "s", title: "t", subtitle: "", blurb: null, coverImage: null, status: "coming_soon", visible: true,
      publisher: "", purchaseLinks: [], toc: ["a", "b"], year: 2026, pages: null, isbn: "",
    });
    expect(f).toMatchObject({ slug: "s", status: "coming_soon", visible: true, tocText: "a\nb", year: "2026", pages: "", blurb: "" });
    expect(bookToForm({ ...f, blurb: null, coverImage: null, status: "weird", purchaseLinks: [], toc: [], year: null, pages: null }).status).toBe("writing");
  });
});
