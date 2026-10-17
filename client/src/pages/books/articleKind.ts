/**
 * "סוג" של מאמר בעורך (site-pivot-books): מאמר רגיל (של מורה), פרק לדוגמה, או חומר עזר לספר.
 * היגיון טהור ונבדק; העורך רק מציג אותו.
 */
export type ArticleKind = "article" | "chapter" | "material";
export const ARTICLE_KINDS: ArticleKind[] = ["article", "chapter", "material"];
export const ARTICLE_KIND_LABELS: Record<ArticleKind, string> = {
  article: "מאמר",
  chapter: "פרק לדוגמה מספר",
  material: "חומר עזר לספר",
};

export function kindOfRow(row: { bookId?: number | null; bookRole?: string | null }): ArticleKind {
  if (row.bookId == null) return "article";
  return row.bookRole === "material" ? "material" : "chapter";
}

export interface BookPick { id: number; slug: string; title: string }

/**
 * השדות שנשלחים לשרת לפי הסוג. לפרק/חומר עזר: `category` = slug הספר (כך "המאמר הבא" = הפרק הבא),
 * ו-bookId/bookRole/chapterNo/chapterLabel מלאים. למאמר רגיל: bookId=null (ניתוק), הקטגוריה כפי שנבחרה.
 */
export function bookFieldsForSubmit(
  kind: ArticleKind,
  f: { category: string; bookId: number | null; chapterNo: string; chapterLabel: string },
  books: BookPick[],
): { error: string } | {
  category: string; bookId: number | null; bookRole: "chapter" | "material"; chapterNo: number | null; chapterLabel: string;
} {
  if (kind === "article") {
    if (!f.category) return { error: "יש לבחור קטגוריה" };
    return { category: f.category, bookId: null, bookRole: "chapter", chapterNo: null, chapterLabel: "" };
  }
  const book = books.find((b) => b.id === f.bookId);
  if (!book) return { error: "יש לבחור ספר" };
  const n = Number.parseInt(f.chapterNo.trim(), 10);
  return {
    category: book.slug,
    bookId: book.id,
    bookRole: kind,
    chapterNo: Number.isFinite(n) && n >= 0 ? n : null,
    chapterLabel: f.chapterLabel.trim().slice(0, 128),
  };
}

/** תווית לטבלת הניהול: "דרך הרוח · פרק 2" / "דרך הרוח · חומר עזר". */
export function bookBadge(row: { bookId?: number | null; bookRole?: string | null; chapterLabel?: string | null }, books: BookPick[]): string | null {
  if (row.bookId == null) return null;
  const title = books.find((b) => b.id === row.bookId)?.title ?? `ספר #${row.bookId}`;
  const what = row.chapterLabel?.trim() || (row.bookRole === "material" ? "חומר עזר" : "פרק");
  return `${title} · ${what}`;
}
