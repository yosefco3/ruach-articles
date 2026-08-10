import { describe, it, expect } from "vitest";
import {
  htmlToMarkdown,
  articleToMarkdownFile,
  buildIndex,
  decodeEntities,
  type ArticleFull,
} from "./sync-articles";

describe("htmlToMarkdown", () => {
  it("converts paragraphs and headings", () => {
    const md = htmlToMarkdown("<h2>כותרת</h2><p>שורה ראשונה.</p><p>שורה שנייה.</p>");
    expect(md).toBe("## כותרת\n\nשורה ראשונה.\n\nשורה שנייה.\n");
  });

  it("skips empty paragraphs (TipTap emits them)", () => {
    const md = htmlToMarkdown("<p></p><p>תוכן</p><p></p>");
    expect(md).toBe("תוכן\n");
  });

  it("converts bold, italic and links inline", () => {
    const md = htmlToMarkdown(
      '<p>טקסט <strong>מודגש</strong> ו-<em>נטוי</em> עם <a href="https://x.co">קישור</a>.</p>'
    );
    expect(md).toBe("טקסט **מודגש** ו-*נטוי* עם [קישור](https://x.co).\n");
  });

  it("converts blockquotes with nested paragraphs", () => {
    const md = htmlToMarkdown("<blockquote><p>ציטוט ראשון.</p><p>המשך.</p></blockquote>");
    expect(md).toBe("> ציטוט ראשון.\n>\n> המשך.\n");
  });

  it("converts the quote-collapse details element", () => {
    const md = htmlToMarkdown(
      '<details class="quote-collapse"><summary>מקור</summary><blockquote><p>ציטוט ארוך.</p></blockquote></details>'
    );
    expect(md).toBe("> **מקור**\n>\n> > ציטוט ארוך.\n");
  });

  it("converts unordered and ordered lists", () => {
    const md = htmlToMarkdown("<ul><li>אחד</li><li>שניים</li></ul><ol><li>א</li><li>ב</li></ol>");
    expect(md).toBe("- אחד\n- שניים\n\n1. א\n2. ב\n");
  });

  it("converts images, hr and br", () => {
    const md = htmlToMarkdown('<p>לפני<br>אחרי</p><hr><img src="/pic.jpg" alt="תמונה">');
    expect(md).toBe("לפני\nאחרי\n\n---\n\n![תמונה](/pic.jpg)\n");
  });

  it("decodes HTML entities including numeric", () => {
    expect(decodeEntities("&quot;שלום&quot; &amp; &#1513;")).toBe('"שלום" & ש');
    const md = htmlToMarkdown("<p>&quot;מרכאות&quot;&nbsp;ורווח</p>");
    expect(md).toBe('"מרכאות" ורווח\n');
  });

  it("keeps text of unknown tags instead of dropping it", () => {
    const md = htmlToMarkdown("<p><abbr>תוכן חשוב</abbr></p>");
    expect(md).toBe("תוכן חשוב\n");
  });

  it("drops HTML comments, style, script and svg subtrees entirely", () => {
    const md = htmlToMarkdown(
      "<!-- הערת עורך -->" +
        "<style>#x{color:red;}</style>" +
        "<script>alert(1)</script>" +
        '<svg viewBox="0 0 8 8"><defs><linearGradient/></defs><text>תווית גרפית</text></svg>' +
        "<p>רק זה נשאר</p>"
    );
    expect(md).toBe("רק זה נשאר\n");
  });

  it("converts tables to markdown tables", () => {
    const md = htmlToMarkdown(
      "<table><colgroup><col></colgroup><tbody><tr><th>עמודה א</th><th>עמודה ב</th></tr><tr><td>1</td><td>2</td></tr></tbody></table>"
    );
    expect(md).toBe("| עמודה א | עמודה ב |\n| --- | --- |\n| 1 | 2 |\n");
  });

  it("keeps widget text content while dropping its chrome", () => {
    const md = htmlToMarkdown(
      '<div id="map"><style>.x{}</style><header><h2>כותרת ווידג\'ט</h2></header><p>תוכן אמיתי.</p></div>'
    );
    expect(md).toBe("## כותרת ווידג'ט\n\nתוכן אמיתי.\n");
  });

  it("strips style attributes without breaking parsing", () => {
    const md = htmlToMarkdown('<p style="text-align: right;">מיושר</p>');
    expect(md).toBe("מיושר\n");
  });
});

const sample: ArticleFull = {
  id: 7,
  title: 'מאמר עם "מרכאות"',
  slug: "abc123",
  excerpt: "תקציר  עם\nשבירת שורה",
  category: "פילוסופיה",
  tags: "רוח, תודעה",
  authorName: "יוסף",
  createdAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-06-02T10:00:00.000Z",
  body: "<p>גוף</p>",
};

describe("articleToMarkdownFile", () => {
  it("emits valid frontmatter with escaped quotes, title and flattened excerpt", () => {
    const md = articleToMarkdownFile(sample, "https://ruachwisdom.org");
    expect(md).toContain('title: "מאמר עם \\"מרכאות\\""');
    expect(md).toContain('created: "2026-05-01"');
    expect(md).toContain('url: "https://ruachwisdom.org/article/abc123"');
    expect(md).toContain('# מאמר עם "מרכאות"');
    expect(md).toContain("> **תקציר:** תקציר עם שבירת שורה");
    expect(md.trim().endsWith("גוף")).toBe(true);
  });
});

describe("buildIndex", () => {
  it("groups by category and links to article files", () => {
    const idx = buildIndex([sample, { ...sample, id: 8, slug: "z9", title: "שני", tags: "" }], "2026-08-10 12:00 UTC");
    expect(idx).toContain("## פילוסופיה");
    expect(idx).toContain("[מאמר עם \"מרכאות\"](articles/abc123.md)");
    expect(idx).toContain("(2026-05-01 · רוח, תודעה)");
    expect(idx).toContain("2 מאמרים מפורסמים");
  });
});
