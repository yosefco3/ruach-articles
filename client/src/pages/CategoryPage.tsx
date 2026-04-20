import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import { useParams, Link } from "wouter";
import { Loader2, Feather, ArrowRight, BookOpen } from "lucide-react";
import { useDynamicCategories } from "@/hooks/useDynamicCategories";

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const category = params.category;

  const { data: articles, isLoading } = trpc.articles.list.useQuery({ category });
  const { data: categoryInfo } = trpc.categories.bySlug.useQuery({ slug: category });
  const { getCategoryLabel, getCategoryBadgeStyle } = useDynamicCategories();

  const color = categoryInfo?.color || "#8B6914";

  return (
    <div>
      {/* ── Category Header ── */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, transparent 50%, ${color}08 100%)`,
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: color }}
        />

        <div className="container relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Link>

          <div className="text-center">
            {/* Category badge */}
            <span
              className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-5 border"
              style={getCategoryBadgeStyle(category)}
            >
              {getCategoryLabel(category)}
            </span>

            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4 leading-tight">
              {categoryInfo?.name ?? category}
            </h1>

            <div
              className="w-16 h-0.5 mx-auto mb-5 rounded-full"
              style={{ backgroundColor: color }}
            />

            {categoryInfo?.description && (
              <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                {categoryInfo.description}
              </p>
            )}

            {articles && articles.length > 0 && (
              <p className="text-sm text-muted-foreground mt-4">
                {articles.length} מאמרים
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Articles Grid ── */}
      <section className="container py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">אין מאמרים בקטגוריה זו עדיין</p>
            <p className="text-muted-foreground/60 text-sm mt-2">חזרו בקרוב לתכנים חדשים</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 text-primary hover:underline text-sm font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לדף הבית
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                כל המאמרים
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
