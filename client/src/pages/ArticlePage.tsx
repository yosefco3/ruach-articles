import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCategoryBadgeClass, getCategoryLabel } from "@/lib/categories";
import { Loader2, Calendar, User, MessageCircle, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: article, isLoading, error } = trpc.articles.bySlug.useQuery({ slug: params.slug });

  const { data: comments, isLoading: commentsLoading } = trpc.comments.list.useQuery(
    { articleId: article?.id ?? 0 },
    { enabled: !!article?.id }
  );

  const [commentBody, setCommentBody] = useState("");

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentBody("");
      utils.comments.list.invalidate({ articleId: article!.id });
      toast.success("התגובה נוספה בהצלחה");
    },
    onError: (err) => toast.error(err.message || "שגיאה בהוספת תגובה"),
  });

  const deleteComment = trpc.comments.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.comments.list.cancel({ articleId: article!.id });
      const prev = utils.comments.list.getData({ articleId: article!.id });
      utils.comments.list.setData({ articleId: article!.id }, (old) =>
        old ? old.filter((c) => c.id !== id) : old
      );
      return { prev };
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) utils.comments.list.setData({ articleId: article!.id }, ctx.prev);
      toast.error(err.message || "שגיאה במחיקת תגובה");
    },
    onSettled: () => utils.comments.list.invalidate({ articleId: article!.id }),
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
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      <div className="container py-10 max-w-3xl mx-auto">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          חזרה לכל המאמרים
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${getCategoryBadgeClass(article.category)}`}>
            {getCategoryLabel(article.category)}
          </span>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground leading-tight mb-4">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-4 font-light">
              {article.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {article.authorName && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {article.authorName}
              </span>
            )}
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

        <div className="divider-gold mb-8" />

        {/* Article Body */}
        <div className="prose prose-invert max-w-none mb-12" dir="rtl" style={{ textAlign: "right" }}>
          <div dangerouslySetInnerHTML={{ __html: article.body }} />
        </div>

        <div className="divider-gold mb-10" />

        {/* Attachments Section */}
        {article.attachments && article.attachments.length > 0 && (
          <section className="mb-10">
            <h3 className="font-display font-bold text-lg text-foreground mb-4">קבצים מצורפים</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {article.attachments.map((file: any) => (
                <a
                  key={file.id}
                  href={file.fileUrl}
                  download={file.fileName}
                  className="flex items-center gap-3 p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="divider-gold mb-10" />

        {/* Comments Section */}
        <section>
          <h2 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            תגובות
            {comments && comments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>
            )}
          </h2>

          {/* Add Comment */}
          {isAuthenticated ? (
            <div className="bg-card border border-border rounded-xl p-5 mb-8">
              <p className="text-sm font-medium text-foreground mb-3">
                מגיב/ה בתור <span className="text-primary">{user?.name}</span>
              </p>
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="כתבו את תגובתכם כאן..."
                className="mb-3 resize-none min-h-[100px] text-right"
                dir="rtl"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!commentBody.trim()) return;
                    createComment.mutate({ articleId: article.id, body: commentBody.trim() });
                  }}
                  disabled={createComment.isPending || !commentBody.trim()}
                  size="sm"
                >
                  {createComment.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  פרסום תגובה
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-secondary/50 border border-border rounded-xl p-6 mb-8 text-center">
              <p className="text-muted-foreground mb-3">כדי להגיב, יש להתחבר תחילה</p>
              <Button size="sm" onClick={() => (window.location.href = getLoginUrl())}>
                כניסה לאתר
              </Button>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>אין תגובות עדיין. היו הראשונים להגיב!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const isOwner = user?.id === comment.userId;
                const commentDate = new Date(comment.createdAt).toLocaleDateString("he-IL", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div key={comment.id} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{comment.userName || "משתמש"}</p>
                          <p className="text-xs text-muted-foreground">{commentDate}</p>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => deleteComment.mutate({ id: comment.id })}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                          title="מחיקת תגובה"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-foreground leading-relaxed">{comment.body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
