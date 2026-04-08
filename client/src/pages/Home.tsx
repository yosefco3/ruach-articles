import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import { useState } from "react";
import { Loader2, Feather } from "lucide-react";
import { Link } from "wouter";
import { CATEGORY_MAP } from "@/lib/categories";

const CATEGORIES = Object.entries(CATEGORY_MAP).map(([key, val]) => ({ key, ...val }));

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: settings } = trpc.settings.get.useQuery();

  const { data: articles, isLoading } = trpc.articles.list.useQuery(
    activeCategory ? { category: activeCategory as "spirituality" | "philosophy" | "healing" } : undefined
  );

  const filteredArticles = articles?.filter(article =>
    searchQuery === "" ||
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const featured = articles?.[0];
  const rest = articles?.slice(1) ?? [];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero-gradient py-20 px-4">
        <div className="container text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Feather className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-foreground mb-4 leading-tight">
            {settings?.siteTitle || "רוּחַ"}
          </h1>
          <div className="divider-gold max-w-xs mx-auto mb-6" />
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            {settings?.heroSubtitle || "מרחב לעומק, לשקט ולחיפוש הפנימי — מאמרים ברוחניות, פילוסופיה וריפוי"}
          </p>
          <div className="mt-8 max-w-md mx-auto">
            <input
              type="text"
              placeholder="חיפוש מאמרים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              dir="rtl"
            />
          </div>
        </div>
      </section>

      {/* ── Category Tabs ── */}
      <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container">
          <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              הכל
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key === activeCategory ? null : cat.key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Articles ── */}
      <section className="container py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !filteredArticles || filteredArticles.length === 0 ? (
          <div className="text-center py-24">
            <Feather className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">{searchQuery ? "לא נמצאו מאמרים תואמים" : "אין מאמרים עדיין"}</p>
            <p className="text-muted-foreground/60 text-sm mt-1">חזרו בקרוב לתכנים חדשים</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && !activeCategory && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">מאמר מומלץ</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <ArticleCard {...featured} featured />
              </div>
            )}

            {/* Grid */}
            {(activeCategory ? articles?.length ?? 0 : rest.length) > 0 && (
              <>
                {!activeCategory && (
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">מאמרים נוספים</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(activeCategory ? articles : rest)?.map((article) => (
                    <ArticleCard key={article.id} {...article} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* ── Category Showcase ── */}
      {!activeCategory && !isLoading && (
        <section className="bg-secondary/50 py-16">
          <div className="container">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">גלו לפי נושא</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {CATEGORIES.map((cat) => (
                <Link key={cat.key} href={`/category/${cat.key}`} className="block group">
                  <div className="bg-card border border-border rounded-xl p-6 text-center card-hover">
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${cat.color}`}>
                      {cat.label}
                    </div>
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
