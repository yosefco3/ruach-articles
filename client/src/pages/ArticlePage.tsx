import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { useDynamicCategories } from "@/hooks/useDynamicCategories";
import { Loader2, Calendar, User, MessageCircle, ArrowRight, Heart, Download, ImageDown } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import CommentsSection from "@/components/CommentsSection";
import NextArticleCard from "@/components/NextArticleCard";
import ArticleActionsBar from "@/components/ArticleActionsBar";
import ArticleAttachments from "@/components/ArticleAttachments";

export default function ArticlePage() {
  // /article/:slug — מאמר רגיל · /book/:book/:slug — פרק לדוגמה / חומר עזר (site-pivot-books)
  const params = useParams<{ slug: string; book?: string }>();
  const bookSlug = params.book;
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { getCategoryLabel, getCategoryBadgeStyle } = useDynamicCategories();
  const { data: article, isLoading, error } = trpc.articles.bySlug.useQuery({ slug: params.slug });
  const { data: book } = trpc.books.bySlug.useQuery({ slug: bookSlug ?? "" }, { enabled: !!bookSlug, retry: false });
  const isChapter = !!bookSlug;
  const { data: siblings } = trpc.articles.chaptersOfBook.useQuery(
    { bookId: book?.id ?? 0, role: article?.bookRole === "material" ? "material" : "chapter" },
    { enabled: isChapter && !!book?.id && !!article },
  );
  const nextChapter = (() => {
    if (!siblings || !article) return undefined;
    const i = siblings.findIndex((c) => c.slug === article.slug);
    return i >= 0 ? siblings[i + 1] : undefined;
  })();
  useDocumentTitle(
    article ? (isChapter && book ? `${article.title} – ${book.title} – דרך הרוח` : `${article.title} – דרך הרוח`) : undefined,
  );

  const { data: comments, isLoading: commentsLoading } = trpc.comments.list.useQuery(
    { articleId: article?.id ?? 0 },
    { enabled: !!article?.id }
  );

  const { data: likeCount } = trpc.likes.count.useQuery(
    { articleId: article?.id ?? 0 },
    { enabled: !!article?.id }
  );

  const { data: userLike } = trpc.likes.userLike.useQuery(
    { articleId: article?.id ?? 0 },
    { enabled: !!article?.id && isAuthenticated }
  );

  // Query for next article in same category
  const { data: nextArticle } = trpc.articles.nextInCategory.useQuery(
    {
      currentSlug: params.slug,
      category: article?.category ?? "",
    },
    { enabled: !!article?.category && !isChapter }
  );

  // Query for random article (only if no next article exists; never inside a book)
  const { data: randomArticle } = trpc.articles.random.useQuery(
    { excludeId: article?.id },
    { enabled: !!article?.id && !nextArticle && !isChapter }
  );

  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: () => {
      utils.likes.count.invalidate({ articleId: article?.id ?? 0 });
      utils.likes.userLike.invalidate({ articleId: article?.id ?? 0 });
    },
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container py-24 text-center">
        <p className="text-2xl font-display font-bold text-foreground mb-2">המאמר לא נמצא</p>
        <p className="text-muted-foreground mb-6">ייתכן שהמאמר הוסר או שהכתובת שגויה</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה לדף הבית
        </Button>
      </div>
    );
  }

  const dateStr = new Date(article.createdAt).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tags = article.tags ? article.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div>
      {/* Cover Image */}
      {article.coverImage && (
        <div className="w-full pt-6 pb-2">
          <div className="container max-w-3xl mx-auto px-4">
            <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-border/40 bg-secondary/20">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full max-h-[520px] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <div className="container py-10 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href={isChapter ? `/book/${encodeURIComponent(bookSlug!)}` : "/"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          {isChapter ? `חזרה לספר${book ? `: ${book.title}` : ""}` : "חזרה לכל המאמרים"}
        </Link>

        {/* Admin / author actions — renders nothing for regular readers */}
        <ArticleActionsBar article={article} />

        {/* Article Header */}
        <header className="mb-8">
          {isChapter ? (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 border border-primary/30 bg-primary/10 text-primary">
              {book?.title ?? "ספר"} · {article.chapterLabel || (article.bookRole === "material" ? "חומר עזר" : "פרק לדוגמה")}
            </span>
          ) : (
          <Link
            href={`/category/${article.category}`}
            className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 border transition-opacity hover:opacity-80"
            style={getCategoryBadgeStyle(article.category)}
          >
            {getCategoryLabel(article.category)}
          </Link>
          )}
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground leading-tight mb-4">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-4 font-light">
              {article.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {article.teacherSlug && article.teacherName ? (
              <Link href={`/teacher/${encodeURIComponent(article.teacherSlug)}`} className="flex items-center gap-1.5 text-primary hover:underline">
                <User className="w-4 h-4" />
                {article.teacherName}
              </Link>
            ) : !isChapter ? (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {article.authorName}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {dateStr}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              {comments?.length ?? 0} תגובות
            </span>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Download buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <a
            href={`/api/article-docx/${article.slug}`}
            download
            rel="nofollow"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            הורד מאמר (Word)
          </a>
          {article.coverImage && (
            <a
              href={article.coverImage}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all text-sm font-medium"
            >
              <ImageDown className="w-4 h-4" />
              הורד תמונת שער
            </a>
          )}
        </div>

        {/* Likes Section */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.error("יש להתחבר כדי לסמן אהבתי");
                return;
              }
              if (article?.id) likeMutation.mutate({ articleId: article.id });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              userLike
                ? "bg-red-900/30 border-red-800 text-red-400"
                : "bg-card border-border text-muted-foreground hover:border-red-800 hover:text-red-400"
            }`}
          >
            <Heart className={`w-5 h-5 ${userLike ? "fill-red-500 text-red-500" : ""}`} />
            <span className="text-sm font-medium">{likeCount ?? 0} אהבו</span>
          </button>
        </div>

        <div className="divider-gold mb-8" />

        {/* Article Body */}
        <div className="prose-rtl max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: article.body }} />
        </div>

        <div className="divider-gold mb-10" />

        {/* Attachments Section */}
        {article.attachments && article.attachments.length > 0 && (
          <ArticleAttachments attachments={article.attachments} />
        )}

        <div className="divider-gold mb-10" />

        {/* Inside a book: next chapter + the full book */}
        {isChapter && (
          <section className="mb-10 space-y-4">
            {nextChapter && (
              <Link
                href={`/book/${encodeURIComponent(bookSlug!)}/${encodeURIComponent(nextChapter.slug)}`}
                className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all"
              >
                <span className="text-xs text-muted-foreground">{article.bookRole === "material" ? "חומר העזר הבא" : "הפרק הבא"}</span>
                <p className="font-display font-bold text-lg text-foreground mt-1">
                  {nextChapter.chapterLabel ? `${nextChapter.chapterLabel} · ` : ""}{nextChapter.title}
                </p>
              </Link>
            )}
            {book && (
              <Link
                href={`/book/${encodeURIComponent(book.slug)}`}
                className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 hover:bg-primary/10 transition-colors"
              >
                {book.coverImage && <img src={book.coverImage} alt="" className="w-14 rounded shadow" />}
                <div>
                  <span className="text-xs text-primary font-semibold">הספר המלא</span>
                  <p className="font-display font-bold text-lg text-foreground">{book.title}</p>
                  {book.subtitle && <p className="text-sm text-muted-foreground">{book.subtitle}</p>}
                </div>
              </Link>
            )}
          </section>
        )}

        {/* Next Article Navigation */}
        {!isChapter && (nextArticle || randomArticle) && (
          <section className="mb-10">
            <NextArticleCard 
              article={nextArticle || randomArticle!} 
              isRandom={!nextArticle && !!randomArticle}
            />
          </section>
        )}

        <div className="divider-gold mb-10" />

        {/* Comments Section */}
        {article.id && <CommentsSection articleId={article.id} />}
      </div>
    </div>
  );
}
