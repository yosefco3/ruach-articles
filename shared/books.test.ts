import { describe, it, expect } from "vitest";
import {
  parsePurchaseLinks,
  serializePurchaseLinks,
  parseToc,
  tocFromLines,
  bookCta,
  BOOK_STATUS_LABELS,
} from "./books";

describe("parsePurchaseLinks", () => {
  it("returns [] for null, empty and broken JSON", () => {
    expect(parsePurchaseLinks(null)).toEqual([]);
    expect(parsePurchaseLinks("")).toEqual([]);
    expect(parsePurchaseLinks("{not json")).toEqual([]);
    expect(parsePurchaseLinks('{"a":1}')).toEqual([]);
  });

  it("keeps valid links, drops junk, defaults unknown kind to other", () => {
    const raw = JSON.stringify([
      { label: " בוקפוד ", url: "https://bookfood.co.il/x", kind: "print" },
      { label: "עברית", url: "https://evrit.co.il/y", kind: "ebook" },
      { label: "מוזר", url: "https://z.example", kind: "pdf" },
      { label: "", url: "https://empty.example", kind: "print" },
      { label: "לא url", url: "javascript:alert(1)", kind: "print" },
      "string",
      null,
    ]);
    expect(parsePurchaseLinks(raw)).toEqual([
      { label: "בוקפוד", url: "https://bookfood.co.il/x", kind: "print" },
      { label: "עברית", url: "https://evrit.co.il/y", kind: "ebook" },
      { label: "מוזר", url: "https://z.example", kind: "other" },
    ]);
  });

  it("serialize → parse round-trips and normalizes", () => {
    const s = serializePurchaseLinks([{ label: "x", url: "https://a.b", kind: "print" }]);
    expect(parsePurchaseLinks(s)).toEqual([{ label: "x", url: "https://a.b", kind: "print" }]);
  });
});

describe("toc", () => {
  it("parses tolerant and converts form lines", () => {
    expect(parseToc(null)).toEqual([]);
    expect(parseToc("oops")).toEqual([]);
    expect(parseToc(JSON.stringify(["א", " ", 3, "ב "]))).toEqual(["א", "ב"]);
    expect(parseToc(tocFromLines("שער א\n\n  שער ב  \r\nשער ג"))).toEqual(["שער א", "שער ב", "שער ג"]);
  });
});

describe("bookCta", () => {
  const link = { label: "בוקפוד", url: "https://bookfood.co.il/x", kind: "print" as const };
  it("buy only when available AND links exist", () => {
    expect(bookCta("available", [link])).toEqual({ kind: "buy", links: [link] });
    expect(bookCta("available", [])).toMatchObject({ kind: "notify" });
    expect(bookCta("coming_soon", [link])).toMatchObject({ kind: "notify" });
  });
  it("writing gets its own notify wording", () => {
    expect(bookCta("writing", [])).toMatchObject({ kind: "notify", label: expect.stringContaining("בכתיבה") });
    expect(BOOK_STATUS_LABELS.coming_soon).toBe("בקרוב");
  });
});
