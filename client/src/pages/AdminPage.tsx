import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDynamicCategories } from "@/hooks/useDynamicCategories";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Settings, Mail, Send, ArrowUpDown, Sparkles, Search, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { getCategoryLabel, getCategoryBadgeStyle, categories } = useDynamicCategories();

  const { data: articles, isLoading } = trpc.articles.list.useQuery({ all: true });
  const { data: featuredArticle } = trpc.featured.get.useQuery();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (!q) return true;
      const haystack = [
        a.title,
        a.excerpt ?? "",
        getCategoryLabel(a.category),
        Array.isArray(a.tags) ? a.tags.join(" ") : "",
      ]
        .join(" ")
        .toLowerCase();
      // match every whitespace-separated word, in any order
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [articles, search, categoryFilter, getCategoryLabel]);

  const hasFilters = search.trim() !== "" || categoryFilter !== "all";

  const deleteArticle = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.list.invalidate();
      toast.success("המאמר נמחק בהצלחה");
    },
    onError: (err) => toast.error(err.message || "שגיאה במחיקת המאמר"),
  });

  const updateArticle = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.list.invalidate();
      toast.success("המאמר עודכן");
    },
    onError: (err) => toast.error(err.message || "שגיאה בעדכון המאמר"),
  });

  const setFeatured = trpc.featured.set.useMutation({
    onSuccess: () => {
      utils.featured.get.invalidate();
      toast.success("המאמר הוגדר כמומלץ");
    },
    onError: (err) => toast.error(err.message || "שגיאה בהגדרת מאמר מומלץ"),
  });

  const sendNewsletter = trpc.articles.sendNewsletter.useMutation({
    onSuccess: () => toast.success("הניוזלטר נשלח בהצלחה לכל המנויים הפעילים"),
    onError: (err) => toast.error(err.message || "שגיאה בשליחת הניוזלטר"),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-24 text-center">
        <Settings className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-xl font-display font-bold text-foreground mb-2">גישה מוגבלת</p>
        <p className="text-muted-foreground mb-6">עמוד זה מיועד למנהלים בלבד</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          חזרה לדף הבית
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">לוח ניהול</h1>
          <p className="text-muted-foreground mt-1">ניהול מאמרים ותכנים</p>
        </div>
        <Button asChild>
          <Link href="/admin/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            מאמר חדש
          </Link>
        </Button>
      </div>

       <div className="divider-gold mb-8" />
      {/* Quick links */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/categories" className="gap-2">
            <Settings className="w-4 h-4" />
            ניהול קטגוריות
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/newsletter" className="gap-2">
            <Mail className="w-4 h-4" />
            מנויי ניוזלטר
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/article-order" className="gap-2">
            <ArrowUpDown className="w-4 h-4" />
            סידור מאמרים
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/iching" className="gap-2">
            <Sparkles className="w-4 h-4" />
            אִי צִ׳ינְג
          </Link>
        </Button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "סה\"כ מאמרים", value: articles?.length ?? 0 },
          { label: "מפורסמים", value: articles?.filter((a) => a.published).length ?? 0 },
          { label: "טיוטות", value: articles?.filter((a) => !a.published).length ?? 0 },
          { label: "קטגוריות", value: categories.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & filters */}
      {articles && articles.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי כותרת, תקציר, תגיות..."
              className="pr-10 text-right"
              dir="rtl"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-56 text-right" dir="rtl">
              <SelectValue placeholder="כל הקטגוריות" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
              }}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              נקה
            </Button>
          )}
        </div>
      )}

      {/* Articles Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !articles || articles.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground mb-4">אין מאמרים עדיין</p>
          <Button asChild size="sm">
            <Link href="/admin/new">צרו את המאמר הראשון</Link>
          </Button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground mb-4">לא נמצאו מאמרים התואמים את החיפוש</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
            }}
          >
            נקה סינון
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {hasFilters && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border bg-secondary/30">
              נמצאו {filteredArticles.length} מתוך {articles.length} מאמרים
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-right py-3 px-4 font-semibold text-foreground">כותרת</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground hidden md:table-cell">קטגוריה</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground hidden sm:table-cell">תאריך</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">סטטוס</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article, idx) => (
                  <tr
                    key={article.id}
                    className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${
                      idx % 2 === 0 ? "" : "bg-secondary/10"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/article/${article.slug}`}
                        className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border"
                        style={getCategoryBadgeStyle(article.category)}
                      >
                        {getCategoryLabel(article.category)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                      {new Date(article.createdAt).toLocaleDateString("he-IL")}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          updateArticle.mutate({ id: article.id, published: !article.published })
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          article.published
                            ? "bg-green-900/40 text-green-400 hover:bg-green-900/60"
                            : "bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/60"
                        }`}
                      >
                        {article.published ? (
                          <>
                            <Eye className="w-3 h-3" />
                            מפורסם
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            טיוטה
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 transition-colors ${
                            featuredArticle?.id === article.id
                              ? "text-amber-400 hover:bg-amber-900/30"
                              : "text-muted-foreground hover:text-amber-400 hover:bg-amber-900/20"
                          }`}
                          onClick={() => setFeatured.mutate({ articleId: article.id })}
                          disabled={setFeatured.isPending}
                          title={featuredArticle?.id === article.id ? "מאמר מומלץ" : "הגדר כמומלץ"}
                        >
                          {featuredArticle?.id === article.id ? "⭐" : "☆"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-400 hover:bg-blue-900/20"
                          title="שלח לניוזלטר"
                          disabled={sendNewsletter.isPending}
                          onClick={() =>
                            sendNewsletter.mutate({
                              articleId: article.id,
                              siteUrl: window.location.origin,
                            })
                          }
                        >
                          {sendNewsletter.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/admin/edit/${article.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>מחיקת מאמר</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתם בטוחים שברצונכם למחוק את המאמר "{article.title}"?
                                פעולה זו אינה ניתנת לביטול וכל התגובות יימחקו גם כן.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteArticle.mutate({ id: article.id })}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                מחיקה
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
