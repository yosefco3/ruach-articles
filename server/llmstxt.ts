import { type Request, type Response } from "express";
import { getArticles, listBooks, listTeachers } from "./db";
import { articlePath } from "@shared/articleUrl";
import { BOOK_STATUS_LABELS } from "@shared/books";
import { listCardTexts } from "./db/tarot";
import { CARDS, cardSlug } from "@shared/tarot";
import { SITE_URL_PRODUCTION } from "@shared/const";

// ─── /llms.txt — AI-readable site index (llmstxt.org convention) ─────────────
//
// A markdown file AI crawlers and agents read instead of guessing structure
// from HTML: H1 title, blockquote summary, then link sections. Advisory only
// (Google ignores it) — the real content stays SSR-rendered for classic
// crawlers; this is a cheap extra surface for LLM-based engines.

/** One `- [title](url): description` line; strips newlines so the list stays valid markdown. */
function linkLine(title: string, url: string, description?: string | null): string {
  const desc = description?.replace(/\s+/g, " ").trim();
  return `- [${title}](${url})${desc ? `: ${desc}` : ""}`;
}

export async function serveLlmsTxt(req: Request, res: Response): Promise<void> {
  const base = SITE_URL_PRODUCTION;

  const lines: string[] = [
    "# דרך הרוח (Ruach Wisdom)",
    "",
    "> אתר שיטת \"דרך הרוח — הנבואה הטבעית\" מאת יונתן בן חנן: הספרים, קריאות טארוט ואי צ'ינג, ומורי השיטה — " +
      "הקשר החי, הטבעי והבלתי-מתווך של האדם אל האל.",
    "",
    "האתר עוקב אחרי מנגנון אחד כפי שהוא מופיע אצל הוגים ממסורות שמעולם לא נפגשו — " +
      "ירמיהו, הרמב\"ם, הרמח\"ל, דון חואן (קסטנדה), הטאו וצ'י גונג — ובוחר מכל הוגה רק את הקטעים שמתארים אותו.",
    "",
    "## עמודים מרכזיים",
    "",
    linkLine("דרך הרוח — הנבואה הטבעית", `${base}/derech`, "השיטה: חמישה עקרונות ומבחן קבלה"),
    linkLine("הספרים", `${base}/books`, "ספרי השיטה — תקצירים, תוכן עניינים, פרקים לדוגמה וחומרי עזר"),
    linkLine("קריאת אי צ'ינג", `${base}/iching`, "הטלת מטבעות וקריאה חיה בעברית — ספר התמורות"),
    linkLine("קריאה בקלפי טארוט", `${base}/tarot`, "שליפת שלושה קלפים מחפיסה מקורית — מראה סמלית להבנת המצב; לשאלת בחירה בין דרכים ה-AI פורס פריסת בחירה; אחרי פירוש AI אפשר לשאול עד שתי שאלות המשך, לכל אחת קלף מבהיר"),
    linkLine("החפיסה המלאה", `${base}/tarot/deck`, "כל 78 הקלפים של החפיסה המקורית, בסגנון גואש — כולל הורדה חופשית"),
    linkLine("המדריך לקלפי הטארוט", `${base}/tarot/guide`, "מבנה החפיסה, שיטת שלושת הקלפים, פריסת הבחירה בין דרכים ופירוש כל 78 הקלפים בעברית"),
    linkLine("מורים בשיטה", `${base}/teachers`, "מי מלמד ומלווה בדרך הרוח, היכן, ומה כתבו"),
    linkLine("על המחבר", `${base}/about`, "על יונתן בן חנן והאתר"),
    "",
  ];

  // ── הספרים (גלויים) עם פרקי הדוגמה וחומרי העזר שלהם ──
  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles({ published: true });
  } catch (err) {
    console.warn("[llms.txt] Error fetching articles:", err);
  }
  try {
    const books = await listBooks({ visibleOnly: true });
    if (books.length) {
      lines.push("## הספרים", "");
      for (const b of books) {
        const desc = [b.subtitle, BOOK_STATUS_LABELS[b.status]].filter(Boolean).join(" · ");
        lines.push(linkLine(b.title, `${base}/book/${encodeURIComponent(b.slug)}`, desc || undefined));
        for (const a of articles.filter((x) => x.bookId === b.id)) {
          const path = articlePath(a);
          if (!path) continue;
          const what = a.chapterLabel || (a.bookRole === "material" ? "חומר עזר" : "פרק לדוגמה");
          lines.push("  " + linkLine(`${what}: ${a.title}`, `${base}${path}`, a.excerpt));
        }
      }
      lines.push("");
    }
  } catch (err) {
    console.warn("[llms.txt] Error fetching books:", err);
  }

  // ── מורים בשיטה ──
  try {
    const teachers = await listTeachers({ visibleOnly: true });
    if (teachers.length) {
      lines.push("## מורים בשיטה", "");
      for (const t of teachers) {
        const desc = [t.isFounder ? "מייסד השיטה" : "", t.tagline, t.area].filter(Boolean).join(" · ");
        lines.push(linkLine(t.name, `${base}/teacher/${encodeURIComponent(t.slug)}`, desc || undefined));
      }
      lines.push("");
    }
  } catch (err) {
    console.warn("[llms.txt] Error fetching teachers:", err);
  }

  // ── כתבים של המורים ──
  const writings = articles.filter((a) => a.bookId == null);
  if (writings.length) {
    lines.push("## כתבים", "");
    for (const a of writings) {
      const by = a.teacherName ? ` (${a.teacherName})` : "";
      lines.push(linkLine(`${a.title}${by}`, `${base}${articlePath(a)}`, a.excerpt));
    }
  }

  // ── 78 דפי הקלפים — כל קלף עם התקציר שלו מה-DB (GEO: תשובה-קודם) ──
  lines.push("", "## פירושי קלפי הטארוט", "");
  let cardRows: { cardId: string; name: string; summary: string }[] = [];
  try {
    cardRows = await listCardTexts();
  } catch (err) {
    console.warn("[llms.txt] Error fetching tarot card texts:", err);
  }
  const rowById = new Map(cardRows.map((r) => [r.cardId, r]));
  for (const card of CARDS) {
    const row = rowById.get(card.id);
    const name = row?.name.trim() ? row.name : card.he;
    lines.push(
      linkLine(
        `${name} (${card.en})`,
        `${base}/tarot/card/${cardSlug(card)}`,
        row?.summary || undefined,
      ),
    );
  }

  lines.push(
    "",
    "## Optional",
    "",
    linkLine("RSS", `${base}/rss.xml`, "פיד הפרקים והכתבים"),
    linkLine("Sitemap", `${base}/sitemap.xml`),
    "",
  );

  res
    .status(200)
    .set({
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // like sitemap — regenerate hourly
    })
    .send(lines.join("\n"));
}
