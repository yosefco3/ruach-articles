/**
 * sync-articles — pull all published articles from production into a local
 * knowledge base under knowledge/ (gitignored), as markdown + an INDEX.md.
 *
 * Usage: pnpm sync:articles          (defaults to https://ruachwisdom.org)
 *        RUACH_BASE_URL=... pnpm sync:articles
 *
 * Read-only against production: uses only the public tRPC procedures
 * articles.list and articles.bySlug over HTTP GET.
 */
import fs from "fs";
import path from "path";

const BASE_URL = process.env.RUACH_BASE_URL ?? "https://ruachwisdom.org";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "knowledge");
const ARTICLES_DIR = path.join(OUT_DIR, "articles");
const CONCURRENCY = 5;

// ---------------------------------------------------------------------------
// Minimal HTML → markdown for the RTE's output (TipTap). The corpus uses a
// small tag set (p, h1-h4, strong/em, a, blockquote, ul/ol/li, img, br, hr,
// details.quote-collapse). Unknown tags keep their text and are reported.
// ---------------------------------------------------------------------------

export type HtmlNode = {
  tag: string; // "#text" for text nodes
  attrs: Record<string, string>;
  children: HtmlNode[];
  text: string;
};

const VOID_TAGS = new Set(["br", "img", "hr", "input", "meta", "link", "col", "use", "stop", "path", "circle", "rect", "line"]);

// Subtrees that carry no article text — dropped wholesale. Some articles embed
// hand-built HTML widgets (style blocks, SVG figures, even whole documents);
// their styling/graphics are noise in a markdown knowledge base.
const DROP_TAGS = new Set(["style", "script", "svg", "head", "noscript", "colgroup", "template", "title", "meta", "link"]);

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of raw.matchAll(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g)) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2]);
  }
  return attrs;
}

export function parseHtml(rawHtml: string): HtmlNode {
  const html = rawHtml.replace(/<!--[\s\S]*?-->/g, "").replace(/<!DOCTYPE[^>]*>/gi, "");
  const root: HtmlNode = { tag: "#root", attrs: {}, children: [], text: "" };
  const stack: HtmlNode[] = [root];
  const tagRe = /<\/?([a-zA-Z0-9-]+)((?:"[^"]*"|[^>"])*)\/?>/g;
  let last = 0;
  for (let m = tagRe.exec(html); m; m = tagRe.exec(html)) {
    const textBefore = html.slice(last, m.index);
    if (textBefore) {
      stack[stack.length - 1].children.push({
        tag: "#text",
        attrs: {},
        children: [],
        text: decodeEntities(textBefore),
      });
    }
    last = m.index + m[0].length;
    const tag = m[1].toLowerCase();
    if (m[0].startsWith("</")) {
      // Close the nearest matching open tag; ignore stray closers.
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
    } else {
      const node: HtmlNode = { tag, attrs: parseAttrs(m[2]), children: [], text: "" };
      stack[stack.length - 1].children.push(node);
      if (!VOID_TAGS.has(tag) && !m[0].endsWith("/>")) stack.push(node);
    }
  }
  const tail = html.slice(last);
  if (tail) {
    stack[stack.length - 1].children.push({
      tag: "#text",
      attrs: {},
      children: [],
      text: decodeEntities(tail),
    });
  }
  return root;
}

/** Tags seen during conversion that have no explicit rendering rule. */
export const unknownTags = new Set<string>();

function renderChildren(node: HtmlNode): string {
  return node.children.map(render).join("");
}

function quote(block: string): string {
  return block
    .trim()
    .split("\n")
    .map((l) => ("> " + l).trimEnd())
    .join("\n");
}

function render(node: HtmlNode): string {
  if (DROP_TAGS.has(node.tag)) return "";
  switch (node.tag) {
    case "#text":
      return node.text.replace(/\s+/g, " ");
    case "#root":
    case "div":
    case "span":
    case "section":
    case "article":
    case "main":
    case "header":
    case "footer":
    case "nav":
    case "figure":
    case "html":
    case "body":
      return renderChildren(node);
    case "p": {
      const t = renderChildren(node).trim();
      return t ? t + "\n\n" : "";
    }
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = Number(node.tag[1]);
      return "#".repeat(level) + " " + renderChildren(node).trim() + "\n\n";
    }
    case "strong":
    case "b": {
      const t = renderChildren(node).trim();
      return t ? `**${t}**` : "";
    }
    case "em":
    case "i": {
      const t = renderChildren(node).trim();
      return t ? `*${t}*` : "";
    }
    case "s":
    case "del": {
      const t = renderChildren(node).trim();
      return t ? `~~${t}~~` : "";
    }
    case "u":
    case "mark":
      return renderChildren(node);
    case "a": {
      const t = renderChildren(node).trim() || node.attrs.href || "";
      return node.attrs.href ? `[${t}](${node.attrs.href})` : t;
    }
    case "code": {
      const t = renderChildren(node).trim();
      return t ? "`" + t + "`" : "";
    }
    case "pre":
      return "```\n" + renderChildren(node).trim() + "\n```\n\n";
    case "blockquote":
      return quote(renderChildren(node)) + "\n\n";
    case "ul":
      return (
        node.children
          .filter((c) => c.tag === "li")
          .map((li) => "- " + render(li).trim().replace(/\n+/g, "\n  "))
          .join("\n") + "\n\n"
      );
    case "ol":
      return (
        node.children
          .filter((c) => c.tag === "li")
          .map((li, i) => `${i + 1}. ` + render(li).trim().replace(/\n+/g, "\n   "))
          .join("\n") + "\n\n"
      );
    case "li":
      return renderChildren(node);
    case "br":
      return "\n";
    case "hr":
      return "---\n\n";
    case "img": {
      const alt = node.attrs.alt ?? "";
      return node.attrs.src ? `![${alt}](${node.attrs.src})\n\n` : "";
    }
    // The site's collapsible long-quote feature: <details class="quote-collapse">
    // with a <summary> label. Rendered as a quote with the label bolded on top.
    case "details": {
      const summary = node.children.find((c) => c.tag === "summary");
      const rest = node.children.filter((c) => c.tag !== "summary");
      const label = summary ? render(summary).trim() : "";
      const inner = rest.map(render).join("").trim();
      const parts = [label ? `**${label}**` : "", inner].filter(Boolean).join("\n\n");
      return quote(parts) + "\n\n";
    }
    case "summary":
      return renderChildren(node);
    case "table": {
      const rows: HtmlNode[] = [];
      const collect = (n: HtmlNode) => {
        for (const c of n.children) {
          if (c.tag === "tr") rows.push(c);
          else if (c.tag === "thead" || c.tag === "tbody" || c.tag === "tfoot") collect(c);
        }
      };
      collect(node);
      if (!rows.length) return "";
      const toCells = (tr: HtmlNode) =>
        tr.children
          .filter((c) => c.tag === "td" || c.tag === "th")
          .map((c) => render(c).replace(/\s+/g, " ").trim());
      const lines = rows.map((tr) => `| ${toCells(tr).join(" | ")} |`);
      const cols = toCells(rows[0]).length;
      lines.splice(1, 0, `|${" --- |".repeat(cols)}`);
      return lines.join("\n") + "\n\n";
    }
    case "td":
    case "th":
      return renderChildren(node);
    default:
      unknownTags.add(node.tag);
      return renderChildren(node);
  }
}

export function htmlToMarkdown(html: string): string {
  const md = render(parseHtml(html));
  // Collapse the blank runs left by empty paragraphs.
  return md.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// ---------------------------------------------------------------------------
// Markdown files + index
// ---------------------------------------------------------------------------

export type ArticleMeta = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  tags: string | null;
  authorName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticleFull = ArticleMeta & { body: string; coverImage?: string | null };

const yamlStr = (v: unknown) => JSON.stringify(String(v ?? ""));

export function articleToMarkdownFile(a: ArticleFull, baseUrl: string): string {
  const front = [
    "---",
    `title: ${yamlStr(a.title)}`,
    `slug: ${yamlStr(a.slug)}`,
    `id: ${a.id}`,
    `category: ${yamlStr(a.category)}`,
    `tags: ${yamlStr(a.tags ?? "")}`,
    `author: ${yamlStr(a.authorName ?? "")}`,
    `created: ${yamlStr(String(a.createdAt).slice(0, 10))}`,
    `updated: ${yamlStr(String(a.updatedAt).slice(0, 10))}`,
    `url: ${yamlStr(`${baseUrl}/article/${a.slug}`)}`,
    "---",
    "",
  ].join("\n");
  const excerpt = (a.excerpt ?? "").trim();
  const excerptBlock = excerpt ? `> **תקציר:** ${excerpt.replace(/\s+/g, " ")}\n\n` : "";
  return front + `# ${a.title}\n\n` + excerptBlock + htmlToMarkdown(a.body);
}

const oneLine = (s: string, max: number) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
};

export function buildIndex(articles: ArticleMeta[], syncedAt: string): string {
  const byCategory = new Map<string, ArticleMeta[]>();
  for (const a of articles) {
    const list = byCategory.get(a.category) ?? [];
    list.push(a);
    byCategory.set(a.category, list);
  }
  const lines: string[] = [
    "# מאגר המאמרים — ruachwisdom.org",
    "",
    `> נוצר אוטומטית על ידי \`pnpm sync:articles\` — לא לערוך ידנית. סונכרן: ${syncedAt}.`,
    `> ${articles.length} מאמרים מפורסמים. הקבצים המלאים תחת \`knowledge/articles/\`.`,
    "",
  ];
  for (const [category, list] of byCategory) {
    lines.push(`## ${category}`, "");
    list.sort((x, y) => String(x.createdAt).localeCompare(String(y.createdAt)));
    for (const a of list) {
      const tags = (a.tags ?? "").trim();
      const meta = [String(a.createdAt).slice(0, 10), tags].filter(Boolean).join(" · ");
      const excerpt = a.excerpt ? ` — ${oneLine(a.excerpt, 160)}` : "";
      lines.push(`- [${a.title}](articles/${a.slug}.md) (${meta})${excerpt}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Fetching (public tRPC over HTTP GET, superjson envelope)
// ---------------------------------------------------------------------------

async function trpcGet<T>(proc: string, input?: unknown): Promise<T> {
  const qs =
    input === undefined ? "" : `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  const res = await fetch(`${BASE_URL}/api/trpc/${proc}${qs}`);
  if (!res.ok) throw new Error(`${proc} → HTTP ${res.status}`);
  const payload = (await res.json()) as { result?: { data?: { json?: T } } };
  const data = payload.result?.data?.json;
  if (data === undefined) throw new Error(`${proc} → unexpected response shape`);
  return data;
}

async function mapWithConcurrency<I, O>(
  items: I[],
  limit: number,
  fn: (item: I) => Promise<O>
): Promise<O[]> {
  const out: O[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  console.log(`Syncing articles from ${BASE_URL} …`);
  const list = await trpcGet<ArticleMeta[]>("articles.list");
  console.log(`Found ${list.length} published articles; fetching bodies …`);

  const full = await mapWithConcurrency(list, CONCURRENCY, (a) =>
    trpcGet<ArticleFull | null>("articles.bySlug", { slug: a.slug })
  );

  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const kept = new Set<string>();
  let written = 0;
  for (const a of full) {
    if (!a) continue;
    const fileName = `${a.slug}.md`;
    kept.add(fileName);
    fs.writeFileSync(path.join(ARTICLES_DIR, fileName), articleToMarkdownFile(a, BASE_URL));
    written++;
  }

  // Drop files for articles that no longer exist (renamed slug, unpublished).
  let removed = 0;
  for (const f of fs.readdirSync(ARTICLES_DIR)) {
    if (f.endsWith(".md") && !kept.has(f)) {
      fs.unlinkSync(path.join(ARTICLES_DIR, f));
      removed++;
    }
  }

  const syncedAt = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
  fs.writeFileSync(path.join(OUT_DIR, "INDEX.md"), buildIndex(list, syncedAt));

  console.log(`Wrote ${written} articles to knowledge/articles/ (${removed} stale removed).`);
  console.log(`Index: knowledge/INDEX.md`);
  if (unknownTags.size) {
    console.warn(`Unknown HTML tags (rendered as plain text): ${[...unknownTags].join(", ")}`);
  }
}

// Run only when executed directly (not when imported by tests).
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
