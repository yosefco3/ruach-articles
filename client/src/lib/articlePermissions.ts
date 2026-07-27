/**
 * Who may manage a given article from the public article page.
 * Mirrors the server guard (assertCanEditArticle): admins reach every article,
 * everyone else only the ones they authored. The server is still the authority —
 * this only decides whether the UI is worth showing.
 */

export interface ArticleViewer {
  role?: string;
  /** Numeric users.id — what articles.authorId points at. */
  dbId?: number;
}

export interface ManageableArticle {
  authorId?: number | null;
}

export function isAdmin(user: ArticleViewer | null | undefined): boolean {
  return user?.role === "admin";
}

export function canEditArticle(
  user: ArticleViewer | null | undefined,
  article: ManageableArticle | null | undefined,
): boolean {
  if (!user || !article) return false;
  if (isAdmin(user)) return true;
  return article.authorId != null && article.authorId === user.dbId;
}
