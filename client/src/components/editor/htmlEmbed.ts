import { Node } from "@tiptap/core";

/**
 * HtmlEmbed — a block node that stores a raw HTML string and serializes it
 * verbatim, so self-contained diagrams (inline <style> + divs) survive the
 * editor's schema instead of being stripped on paste/setContent.
 *
 * Serialized form: <div data-html-embed class="html-embed">…raw…</div>
 * The `.html-embed` class is the hook for the CSS token bridge in index.css.
 *
 * Security: only editors that explicitly register this extension can carry
 * embeds (the admin article form). Everywhere else the wrapper is stripped
 * like any unknown HTML. Article bodies are already rendered unsanitized,
 * admin-only — this adds no new surface.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlEmbed: {
      /** Insert a new HTML embed block at the current selection. */
      insertHtmlEmbed: (html: string) => ReturnType;
      /** Replace the HTML of the currently selected embed block. */
      updateHtmlEmbed: (html: string) => ReturnType;
    };
  }
}

export const HtmlEmbed = Node.create({
  name: "htmlEmbed",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      // Stored via the wrapper's innerHTML (see renderHTML/parseHTML),
      // never as a DOM attribute.
      html: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-html-embed]",
        getAttrs: (el) => ({ html: (el as HTMLElement).innerHTML }),
      },
    ];
  },

  renderHTML({ node }) {
    // A real DOM element (a valid DOMOutputSpec) is the only way to emit the
    // stored string as actual markup rather than escaped text. Runs only in
    // the browser (the editor never renders during SSR).
    const dom = document.createElement("div");
    dom.setAttribute("data-html-embed", "");
    dom.className = "html-embed";
    dom.innerHTML = node.attrs.html ?? "";
    return { dom };
  },

  addNodeView() {
    return ({ node }) => {
      let current = node;

      const dom = document.createElement("div");
      dom.className = "html-embed-view";
      dom.contentEditable = "false";

      const bar = document.createElement("div");
      bar.className = "html-embed-view__bar";
      bar.textContent = "בלוק HTML מוטמע — לחצו לבחירה, ואז על כפתור ה-HTML בסרגל לעריכה";

      const preview = document.createElement("div");
      preview.className = "html-embed";
      preview.innerHTML = current.attrs.html ?? "";

      dom.append(bar, preview);

      return {
        dom,
        update(updated) {
          if (updated.type.name !== "htmlEmbed") return false;
          if (updated.attrs.html !== current.attrs.html) {
            preview.innerHTML = updated.attrs.html ?? "";
          }
          current = updated;
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertHtmlEmbed:
        (html) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { html } }),
      updateHtmlEmbed:
        (html) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { html }),
    };
  },
});
