import { type Request, type Response } from "express";
import { getArticles } from "./db";
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
    "# רוח חכמה (Ruach Wisdom)",
    "",
    "> אתר מאמרים בעברית מאת יוסף כהן על רוחניות, יהדות, פילוסופיה וריפוי — " +
      'סביב שיטה אחת: "דרך הרוח — הנבואה הטבעית", הקשר החי, הטבעי והבלתי-מתווך של האדם אל האל.',
    "",
    "האתר עוקב אחרי מנגנון אחד כפי שהוא מופיע אצל הוגים ממסורות שמעולם לא נפגשו — " +
      "ירמיהו, הרמב\"ם, הרמח\"ל, דון חואן (קסטנדה), הטאו וצ'י גונג — ובוחר מכל הוגה רק את הקטעים שמתארים אותו.",
    "",
    "## עמודים מרכזיים",
    "",
    linkLine("דרך הרוח — הנבואה הטבעית", `${base}/derech`, "השיטה שמאחורי כל המאמרים: חמישה עקרונות ומבחן קבלה"),
    linkLine("קריאת אי צ'ינג", `${base}/iching`, "הטלת מטבעות וקריאה חיה בעברית — ספר התמורות"),
    linkLine("אודות", `${base}/about`, "על יוסף כהן והאתר"),
    linkLine("כל המאמרים", base),
    "",
    "## מאמרים",
    "",
  ];

  try {
    const articles = await getArticles({ published: true });
    for (const a of articles) {
      lines.push(linkLine(a.title, `${base}/article/${encodeURIComponent(a.slug)}`, a.excerpt));
    }
  } catch (err) {
    console.warn("[llms.txt] Error fetching articles:", err);
  }

  lines.push(
    "",
    "## Optional",
    "",
    linkLine("RSS", `${base}/rss.xml`, "פיד המאמרים המלא"),
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
