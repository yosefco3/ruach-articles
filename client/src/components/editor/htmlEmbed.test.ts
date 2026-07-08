// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { HtmlEmbed } from "./htmlEmbed";

// A miniature version of a real pasted diagram: inline <style> + nested divs
// with classes — exactly the markup the default schema destroys.
const DIAGRAM_INNER =
  `<style>.crs{background:#faece7;color:#712b13}</style>` +
  `<div class="cmp"><div class="crs"><h4>קורס בניסים</h4><p>העולם אשליה</p></div></div>`;
const DIAGRAM_WRAPPED = `<div data-html-embed>${DIAGRAM_INNER}</div>`;

const editors: Editor[] = [];
function makeEditor(withEmbed: boolean, content = "") {
  const editor = new Editor({
    extensions: withEmbed ? [StarterKit, HtmlEmbed] : [StarterKit],
    content,
  });
  editors.push(editor);
  return editor;
}

afterEach(() => {
  while (editors.length) editors.pop()!.destroy();
});

describe("HtmlEmbed round-trip", () => {
  it("preserves wrapped raw HTML (style tag, classes, structure) through setContent → getHTML", () => {
    const editor = makeEditor(true, `<p>פסקה לפני</p>${DIAGRAM_WRAPPED}<p>פסקה אחרי</p>`);
    const html = editor.getHTML();
    expect(html).toContain("data-html-embed");
    expect(html).toContain(`class="html-embed"`);
    expect(html).toContain("<style>");
    expect(html).toContain(`class="crs"`);
    expect(html).toContain("<h4>קורס בניסים</h4>");
    expect(html).toContain("<p>פסקה לפני</p>");
  });

  it("is idempotent: feeding getHTML() back in yields the same output", () => {
    const first = makeEditor(true, DIAGRAM_WRAPPED).getHTML();
    const second = makeEditor(true, first).getHTML();
    expect(second).toBe(first);
  });

  it("strips the same markup when NOT wrapped in data-html-embed (schema baseline)", () => {
    const editor = makeEditor(true, DIAGRAM_INNER);
    const html = editor.getHTML();
    expect(html).not.toContain("<style>");
    expect(html).not.toContain("crs");
  });

  it("strips even wrapped markup when the extension is not registered (gating)", () => {
    const editor = makeEditor(false, DIAGRAM_WRAPPED);
    const html = editor.getHTML();
    expect(html).not.toContain("data-html-embed");
    expect(html).not.toContain("<style>");
  });
});

describe("HtmlEmbed commands", () => {
  it("insertHtmlEmbed inserts a block that serializes with the given HTML", () => {
    const editor = makeEditor(true, "<p>טקסט</p>");
    editor.commands.insertHtmlEmbed(DIAGRAM_INNER);
    const html = editor.getHTML();
    expect(html).toContain("data-html-embed");
    expect(html).toContain(`class="crs"`);
  });

  it("updateHtmlEmbed replaces the selected block's HTML", () => {
    const editor = makeEditor(true, DIAGRAM_WRAPPED);
    editor.commands.setNodeSelection(0);
    editor.commands.updateHtmlEmbed(`<p class="swapped">חדש</p>`);
    const html = editor.getHTML();
    expect(html).toContain(`class="swapped"`);
    expect(html).not.toContain("crs");
  });
});
