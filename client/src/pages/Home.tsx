import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import { useState } from "react";
import { Loader2, Feather, Mail, Send } from "lucide-react";
import { Link } from "wouter";
import { useDynamicCategories } from "@/hooks/useDynamicCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: settings } = trpc.settings.get.useQuery();
  const { categories, getCategoryBadgeStyle } = useDynamicCategories();

  const { data: articles, isLoading } = trpc.articles.list.useQuery(
    activeCategory ? { category: activeCategory } : undefined
  );
  const { data: featuredArticle } = trpc.featured.get.useQuery();

  // Newsletter state
  const [nlEmail, setNlEmail] = useState("");
  const [nlName, setNlName] = useState("");
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      toast.success("נרשמת בהצלחה לניוזלטר!");
      setNlEmail("");
      setNlName("");
    },
    onError: (err) => toast.error(err.message || "שגיאה בהרשמה"),
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail.trim()) {
      toast.error("אנא הזינו כתובת דוא״ל");
      return;
    }
    subscribeMutation.mutate({ email: nlEmail, name: nlName || undefined });
  };

  const featured = featuredArticle || articles?.[0];
  const displayFeatured = activeCategory ? null : featured;
  const rest = articles?.filter(a => !featured || a.id !== featured.id) ?? [];

  const filteredRest = activeCategory
    ? rest.filter(a => a.category === activeCategory)
    : rest;

  const filteredArticles = filteredRest.filter(article =>
    searchQuery === "" ||
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

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
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug === activeCategory ? null : cat.slug)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {cat.name}
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
            {displayFeatured && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">מאמר מומלץ</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <ArticleCard {...displayFeatured} featured />
              </div>
            )}

            {/* Grid */}
            {filteredArticles.length > 0 && (
              <>
                {!activeCategory && (
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">מאמרים נוספים</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article) => (
                    <ArticleCard key={article.id} {...article} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* ── Category Showcase ── */}
      {!activeCategory && !isLoading && categories.length > 0 && (
        <section className="bg-secondary/50 py-16">
          <div className="container">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">גלו לפי נושא</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {categories.map((cat) => (
                <Link key={cat.slug} href={`/category/${cat.slug}`} className="block group">
                  <div className="bg-card border border-border rounded-xl p-6 text-center card-hover">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 border"
                      style={getCategoryBadgeStyle(cat.slug)}
                    >
                      {cat.name}
                    </span>
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter Signup ── */}
      <section className="py-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="container max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 text-center shadow-sm">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
              הישארו מחוברים
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              הירשמו לניוזלטר שלנו וקבלו עדכונים על מאמרים חדשים, תובנות ותכנים בלעדיים ישירות לתיבת הדוא״ל.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Input
                type="text"
                placeholder="שם (אופציונלי)"
                value={nlName}
                onChange={(e) => setNlName(e.target.value)}
                dir="rtl"
                className="sm:w-1/3"
              />
              <Input
                type="email"
                placeholder="כתובת דוא״ל"
                value={nlEmail}
                onChange={(e) => setNlEmail(e.target.value)}
                dir="ltr"
                className="flex-1"
                required
              />
              <Button
                type="submit"
                disabled={subscribeMutation.isPending}
                className="gap-2 whitespace-nowrap"
              >
                {subscribeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                הרשמה
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              ניתן לבטל את המנוי בכל עת. אנו מכבדים את הפרטיות שלכם.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
