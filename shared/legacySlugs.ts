/**
 * Old article slugs → current ones. The server answers /article/<old> with a 301
 * to /article/<new> — but only once <old> no longer resolves in the DB, so adding
 * an entry here before the rename is harmless and nothing breaks in between.
 *
 * Keep entries forever: external links and search results outlive a rename.
 */
export const LEGACY_ARTICLE_SLUGS: Readonly<Record<string, string>> = {
  // "מקורות הסמכות שלי: כשהחלטתי להשליך את הספרים" was saved with the slug "-"
  // (the Hebrew title transliterated to nothing). Renamed 2026-10-08.
  "-": "my-sources-of-authority",
};

export function legacyArticleSlugTarget(slug: string): string | null {
  return Object.prototype.hasOwnProperty.call(LEGACY_ARTICLE_SLUGS, slug)
    ? LEGACY_ARTICLE_SLUGS[slug]
    : null;
}
