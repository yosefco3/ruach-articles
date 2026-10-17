/**
 * הכתובת הציבורית של מאמר (site-pivot-books): פרק/חומר עזר חי תחת הספר שלו,
 * מאמר של מורה ב-/article/<slug>. null כשהמאמר שייך לספר שאינו גלוי (לא לפרסם בשום פיד).
 */
export function articlePath(a: {
  slug: string;
  bookId?: number | null;
  bookSlug?: string | null;
  bookVisible?: boolean | null;
}): string | null {
  if (a.bookId != null) {
    if (!a.bookSlug || !a.bookVisible) return null;
    return `/book/${encodeURIComponent(a.bookSlug)}/${encodeURIComponent(a.slug)}`;
  }
  return `/article/${encodeURIComponent(a.slug)}`;
}
