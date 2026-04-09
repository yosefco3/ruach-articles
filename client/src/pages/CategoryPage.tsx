import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import { useParams } from "wouter";
import { Loader2, Feather } from "lucide-react";
import { useDynamicCategories } from "@/hooks/useDynamicCategories";

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const category = params.category;

  const { data: articles, isLoading } = trpc.articles.list.useQuery({ category });
  const { getCategoryLabel, getCategoryBadgeStyle, categoryMap } = useDynamicCategories();

  const meta = categoryMap[category];

  return (
    <div>
      {/* Header */}
      <section className="hero-gradient py-16 px-4">
        <div className="container text-center">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 border"
            style={getCategoryBadgeStyle(category)}
          >
            {getCategoryLabel(category)}
          </span>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-3">
            {meta?.name ?? category}
          </h1>
          <div className="divider-gold max-w-xs mx-auto mb-4" />
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {meta?.description}
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="container py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="text-center py-24">
            <Feather className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">אין מאמרים בקטגוריה זו עדיין</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} {...article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
