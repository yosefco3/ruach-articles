import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

export function useDynamicCategories() {
  const { data: categories, isLoading } = trpc.categories.list.useQuery();

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; slug: string; description: string | null; color: string | null }> = {};
    if (categories) {
      for (const cat of categories) {
        map[cat.slug] = cat;
      }
    }
    return map;
  }, [categories]);

  const getCategoryLabel = (slug: string) => {
    return categoryMap[slug]?.name ?? slug;
  };

  const getCategoryColor = (slug: string) => {
    return categoryMap[slug]?.color ?? "#8B6914";
  };

  const getCategoryBadgeStyle = (slug: string) => {
    const color = getCategoryColor(slug);
    return {
      backgroundColor: `${color}20`,
      color: color,
      borderColor: `${color}40`,
    };
  };

  return {
    categories: categories ?? [],
    categoryMap,
    isLoading,
    getCategoryLabel,
    getCategoryColor,
    getCategoryBadgeStyle,
  };
}
