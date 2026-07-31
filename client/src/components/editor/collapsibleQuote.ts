import { Node, mergeAttributes } from "@tiptap/core";

/**
 * CollapsibleQuote — a block node for long quotations the reader can fold away.
 *
 * Serialized form (native, script-free):
 *   <details data-collapsible-quote class="collapsible-quote">
 *     <summary class="collapsible-quote__summary">כותרת</summary>
 *     <div data-collapsible-quote-body class="collapsible-quote__body">…</div>
 *   </details>
 *
 * `<details>` collapses on its own, so the article page needs no JavaScript and
 * the DOCX export (which strips tags) simply shows the quote in full.
 *
 * Inside the editor the node view is an always-open box with a title input —
 * an author editing a collapsed block would be editing what they cannot see.
 */

export const DEFAULT_SUMMARY = "ציטוט מורחב — לחצו לפתיחה";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    collapsibleQuote: {
      /** Wrap the selected blocks in a collapsible quote — or unwrap them. */
      toggleCollapsibleQuote: (summary?: string) => ReturnType;
      /** Set the title shown on the folded box. */
      setCollapsibleQuoteSummary: (summary: string) => ReturnType;
    };
  }
}

export const CollapsibleQuote = Node.create({
  name: "collapsibleQuote",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      // Carried in the <summary> element's text, never as a DOM attribute.
      summary: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: "details",
        getAttrs: (el) => ({
          summary: (el as HTMLElement).querySelector("summary")?.textContent?.trim() ?? "",
        }),
        // Our own body wrapper when present; otherwise (a <details> pasted from
        // elsewhere) everything except the summary, via a detached clone.
        contentElement: (el) => {
          const root = el as HTMLElement;
          const body = root.querySelector<HTMLElement>("[data-collapsible-quote-body]");
          if (body) return body;
          const clone = root.cloneNode(true) as HTMLElement;
          clone.querySelector("summary")?.remove();
          return clone;
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(HTMLAttributes, {
        "data-collapsible-quote": "",
        class: "collapsible-quote",
      }),
      ["summary", { class: "collapsible-quote__summary" }, node.attrs.summary || DEFAULT_SUMMARY],
      ["div", { "data-collapsible-quote-body": "", class: "collapsible-quote__body" }, 0],
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      let current = node;

      const dom = document.createElement("div");
      dom.className = "collapsible-quote-view";

      const bar = document.createElement("div");
      bar.className = "collapsible-quote-view__bar";
      bar.contentEditable = "false";

      const title = document.createElement("input");
      title.type = "text";
      title.dir = "rtl";
      title.className = "collapsible-quote-view__title";
      title.placeholder = DEFAULT_SUMMARY;
      title.value = current.attrs.summary ?? "";
      title.addEventListener("input", () => {
        if (typeof getPos !== "function") return;
        const pos = getPos();
        if (pos == null) return;
        editor.view.dispatch(editor.view.state.tr.setNodeAttribute(pos, "summary", title.value));
      });
      title.addEventListener("keydown", (e) => {
        // Enter/Down from the title line drops into the quote itself.
        if (e.key !== "Enter" && e.key !== "ArrowDown") return;
        if (typeof getPos !== "function") return;
        const pos = getPos();
        if (pos == null) return;
        e.preventDefault();
        editor.commands.focus(pos + 1);
      });

      const hint = document.createElement("span");
      hint.className = "collapsible-quote-view__hint";
      hint.textContent = "ציטוט מתקפל";

      bar.append(hint, title);

      const content = document.createElement("div");
      content.className = "collapsible-quote-view__body";

      dom.append(bar, content);

      return {
        dom,
        contentDOM: content,
        update(updated) {
          if (updated.type.name !== "collapsibleQuote") return false;
          const summary = updated.attrs.summary ?? "";
          // Never fight the caret while the author is typing the title.
          if (summary !== title.value) title.value = summary;
          current = updated;
          return true;
        },
        // The title bar is ours, not ProseMirror's document.
        stopEvent: (e) => bar.contains(e.target as globalThis.Node),
        ignoreMutation: (m) => !content.contains(m.target as globalThis.Node),
      };
    };
  },

  addCommands() {
    return {
      toggleCollapsibleQuote:
        (summary) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, summary ? { summary } : {}),
      setCollapsibleQuoteSummary:
        (summary) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { summary }),
    };
  },
});
