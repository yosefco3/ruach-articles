import { trpc } from "@/lib/trpc";

/** List all categories */
export function useCategories() {
  return trpc.categories.list.useQuery();
}

/** List categories with article counts */
export function useCategoriesWithCounts() {
  return trpc.categories.listWithCounts.useQuery();
}