// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

// a11y-baseline step 04: images inserted through the editor must carry an alt
// attribute — a real description, or an explicit alt="" for decorative images.

const editors: Editor[] = [];
function makeEditor(content = "") {
  const editor = new Editor({ extensions: [StarterKit, Image], content });
  editors.push(editor);
  return editor;
}

afterEach(() => {
  while (editors.length) editors.pop()!.destroy();
});

describe("editor image alt text", () => {
  it("serializes a provided alt onto the img tag", () => {
    const editor = makeEditor("<p></p>");
    editor.chain().focus().setImage({ src: "/uploads/x.jpg", alt: "דיוקן הרמב״ם" }).run();
    expect(editor.getHTML()).toContain('alt="דיוקן הרמב״ם"');
  });

  it("keeps an explicit empty alt (declared decorative) on the img tag", () => {
    const editor = makeEditor("<p></p>");
    editor.chain().focus().setImage({ src: "/uploads/x.jpg", alt: "" }).run();
    expect(editor.getHTML()).toContain('alt=""');
  });

  it("round-trips alt through setContent → getHTML", () => {
    const html = makeEditor('<img src="/uploads/x.jpg" alt="איור שער">').getHTML();
    expect(html).toContain('alt="איור שער"');
  });
});
