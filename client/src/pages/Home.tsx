import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import { useState } from "react";
import { Loader2, Feather, Mail, Send, BookOpen, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: categoriesWithCounts, isLoading: catsLoading } =
    trpc.categories.listWithCounts.useQuery();
  const { data: featuredArticle } = trpc.featured.get.useQuery();

  // For search — fetch all published articles only when searching
  const { data: allArticles } = trpc.articles.list.useQuery(undefined, {
    enabled: searchQuery.length > 0,
  });

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

  const isSearching = searchQuery.length > 0;
  const searchResults =
    allArticles?.filter(
      (article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            {settings?.heroSubtitle ||
              "מרחב לעומק, לשקט ולחיפוש הפנימי — מאמרים ברוחניות, פילוסופיה וריפוי"}
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

      {/* ── Search Results ── */}
      {isSearching ? (
        <section className="container py-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              תוצאות חיפוש עבור &quot;{searchQuery}&quot;
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          {searchResults.length === 0 ? (
            <div className="text-center py-24">
              <Feather className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">לא נמצאו מאמרים תואמים</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* ── Featured Article ── */}
          {featuredArticle && (
            <section className="container py-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  מאמר מומלץ
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <ArticleCard {...featuredArticle} featured />
            </section>
          )}

          {/* ── Categories Grid ── */}
          <section className="py-16 bg-secondary/30">
            <div className="container">
              <div className="flex items-center gap-3 mb-10">
                <div className="flex-1 h-px bg-border" />
                <h2 className="text-xl font-display font-bold text-foreground">
                  גלו לפי נושא
                </h2>
                <div className="flex-1 h-px bg-border" />
              </div>

              {catsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !categoriesWithCounts || categoriesWithCounts.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">אין קטגוריות עדיין</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoriesWithCounts.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="block group outline-none"
                    >
                      <div className="relative h-72 rounded-2xl overflow-hidden shadow-md shadow-black/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/30 group-hover:ring-1 group-hover:ring-primary/30">
                        {/* Full background image */}
                        {cat.latestCoverImage || cat.coverImage ? (
                          <img
                            src={cat.coverImage || cat.latestCoverImage || ""}
                            alt={cat.name}
                            className="absolute inset-0 w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 w-full h-full"
                            style={{
                              background: `linear-gradient(135deg, ${cat.color || "#8B6914"}22, ${cat.color || "#8B6914"}44)`,
                            }}
                          >
                            <div className="flex items-center justify-center h-full">
                              <BookOpen
                                className="w-16 h-16 opacity-30"
                                style={{ color: cat.color || "#8B6914" }}
                              />
                            </div>
                          </div>
                        )}
                        {/* Gradient overlay from bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Content pinned to bottom */}
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <h3
                            className="inline-block text-2xl font-bold px-3 py-1 rounded-lg backdrop-blur-sm"
                            style={{
                              color: cat.color || "#8B6914",
                              backgroundColor: "rgba(0, 0, 0, 0.6)",
                            }}
                          >
                            {cat.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-sm text-white/80 font-medium">
                              {cat.articleCount} מאמרים
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-sm text-white/70 line-clamp-2 mt-2">
                              {cat.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-3 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowLeft className="w-4 h-4" />
                            <span>צפו במאמרים</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
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
              הירשמו לניוזלטר שלנו וקבלו עדכונים על מאמרים חדשים, תובנות ותכנים
              בלעדיים ישירות לתיבת הדוא״ל.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
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
