import { trpc } from "@/lib/trpc";

/** List articles, optionally filtered by category */
export function useArticles(category?: string) {
  return trpc.articles.list.useQuery(
    category ? { category } : undefined,
  );
}

/** Get a single article by slug */
export function useArticle(slug: string) {
  return trpc.articles.bySlug.useQuery({ slug });
}