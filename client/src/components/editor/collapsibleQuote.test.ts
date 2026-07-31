// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CollapsibleQuote, DEFAULT_SUMMARY } from "./collapsibleQuote";

const QUOTE =
  `<details data-collapsible-quote class="collapsible-quote">` +
  `<summary class="collapsible-quote__summary">רמח״ל, דעת תבונות</summary>` +
  `<div data-collapsible-quote-body class="collapsible-quote__body">` +
  `<p>פסקה ראשונה של הציטוט</p><p>פסקה שנייה</p>` +
  `</div></details>`;

const editors: Editor[] = [];
function makeEditor(content = "") {
  const editor = new Editor({ extensions: [StarterKit, CollapsibleQuote], content });
  editors.push(editor);
  return editor;
}

afterEach(() => {
  while (editors.length) editors.pop()!.destroy();
});

describe("CollapsibleQuote round-trip", () => {
  it("preserves the summary and the inner blocks through setContent → getHTML", () => {
    const html = makeEditor(`<p>לפני</p>${QUOTE}<p>אחרי</p>`).getHTML();
    expect(html).toContain("<details");
    expect(html).toContain("data-collapsible-quote");
    expect(html).toContain("רמח״ל, דעת תבונות");
    expect(html).toContain("<p>פסקה ראשונה של הציטוט</p>");
    expect(html).toContain("<p>פסקה שנייה</p>");
    expect(html).toContain("<p>לפני</p>");
    expect(html).toContain("<p>אחרי</p>");
  });

  it("is idempotent: feeding getHTML() back in yields the same output", () => {
    const first = makeEditor(QUOTE).getHTML();
    const second = makeEditor(first).getHTML();
    expect(second).toBe(first);
  });

  it("does not duplicate the summary into the body", () => {
    const html = makeEditor(QUOTE).getHTML();
    expect(html.match(/רמח״ל, דעת תבונות/g)).toHaveLength(1);
  });

  it("adopts a plain <details> pasted from elsewhere, keeping summary out of the body", () => {
    const html = makeEditor(
      `<details><summary>מקור חיצוני</summary><p>גוף הציטוט</p></details>`,
    ).getHTML();
    expect(html).toContain("data-collapsible-quote");
    expect(html).toContain("<p>גוף הציטוט</p>");
    expect(html.match(/מקור חיצוני/g)).toHaveLength(1);
  });

  it("falls back to a default summary when the title is empty", () => {
    const html = makeEditor(
      `<details data-collapsible-quote><div data-collapsible-quote-body><p>ללא כותרת</p></div></details>`,
    ).getHTML();
    expect(html).toContain(DEFAULT_SUMMARY);
  });

  it("keeps formatting inside the quote (marks and nested blockquote)", () => {
    const html = makeEditor(
      `<details data-collapsible-quote><summary>כ</summary>` +
        `<div data-collapsible-quote-body><blockquote><p><strong>מודגש</strong></p></blockquote></div></details>`,
    ).getHTML();
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<strong>מודגש</strong>");
  });
});

describe("CollapsibleQuote commands", () => {
  // The toolbar path: the author has a caret/selection inside the text, never
  // an AllSelection (Ctrl+A + toggle nests, exactly like TipTap's blockquote).
  it("toggleCollapsibleQuote wraps the block holding the selection", () => {
    const editor = makeEditor("<p>פסקה ראשונה</p><p>פסקה שנייה</p>");
    editor.commands.setTextSelection({ from: 2, to: 6 });
    editor.commands.toggleCollapsibleQuote();
    const html = editor.getHTML();
    expect(html).toContain("data-collapsible-quote");
    expect(html).toContain("<p>פסקה ראשונה</p>");
    expect(editor.isActive("collapsibleQuote")).toBe(true);
    // The untouched paragraph stays outside the box.
    expect(html.indexOf("פסקה שנייה")).toBeGreaterThan(html.indexOf("</details>"));
  });

  it("toggleCollapsibleQuote accepts a summary and unwraps on a second call", () => {
    const editor = makeEditor("<p>ציטוט ארוך</p>");
    editor.commands.setTextSelection(3);
    editor.commands.toggleCollapsibleQuote("כותרת מיידית");
    expect(editor.getHTML()).toContain("כותרת מיידית");
    expect(editor.isActive("collapsibleQuote")).toBe(true);

    editor.commands.toggleCollapsibleQuote();
    const html = editor.getHTML();
    expect(html).not.toContain("data-collapsible-quote");
    expect(html).toContain("<p>ציטוט ארוך</p>");
  });

  it("setCollapsibleQuoteSummary replaces the title of the active quote", () => {
    const editor = makeEditor(QUOTE);
    editor.commands.setTextSelection(3);
    editor.commands.setCollapsibleQuoteSummary("כותרת חדשה");
    const html = editor.getHTML();
    expect(html).toContain("כותרת חדשה");
    expect(html).not.toContain("רמח״ל");
  });

  it("strips the block when the extension is not registered (schema baseline)", () => {
    const editor = new Editor({ extensions: [StarterKit], content: QUOTE });
    editors.push(editor);
    const html = editor.getHTML();
    expect(html).not.toContain("data-collapsible-quote");
  });
});
