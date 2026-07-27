import { Link } from "wouter";
import { Loader2, Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { canEditArticle, isAdmin } from "@/lib/articlePermissions";

interface Props {
  article: {
    id: number;
    authorId?: number | null;
    published?: boolean;
  };
}

/**
 * Management strip shown on the public article page to the people who may act on
 * the article: the author (and admins) get an edit shortcut, admins can also
 * promote it to the site's featured article. Renders nothing for everyone else.
 */
export default function ArticleActionsBar({ article }: Props) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const admin = isAdmin(user);

  // Only admins can act on it, so only they need to know the current one.
  const { data: featured } = trpc.featured.get.useQuery(undefined, { enabled: admin });

  const setFeatured = trpc.featured.set.useMutation({
    onSuccess: () => {
      utils.featured.get.invalidate();
      toast.success("המאמר הוגדר כמאמר הראשי");
    },
    onError: (err) => toast.error(err.message || "שגיאה בהגדרת המאמר הראשי"),
  });

  if (!canEditArticle(user, article)) return null;

  const isFeatured = featured?.id === article.id;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-xl border border-dashed border-primary/40 bg-primary/5">
      <span className="text-xs text-muted-foreground ms-1">ניהול המאמר</span>

      {/* from=article tells the editor to send us back here when we're done */}
      <Link
        href={`/admin/edit/${article.id}?from=article`}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Pencil className="w-4 h-4" />
        ערוך מאמר
      </Link>

      {admin && (
        <button
          type="button"
          onClick={() => setFeatured.mutate({ articleId: article.id })}
          disabled={isFeatured || setFeatured.isPending}
          title={isFeatured ? "המאמר כבר מוגדר כמאמר הראשי" : "הצג מאמר זה ככותרת דף הבית"}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            isFeatured
              ? "border-amber-800 bg-amber-900/20 text-amber-400 cursor-default"
              : "border-border bg-card text-foreground hover:border-amber-500/60 hover:text-amber-400"
          }`}
        >
          {setFeatured.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Star className={`w-4 h-4 ${isFeatured ? "fill-amber-400" : ""}`} />
          )}
          {isFeatured ? "זהו המאמר הראשי" : "הפוך למאמר הראשי"}
        </button>
      )}

      {article.published === false && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-900/40 text-yellow-400 text-xs font-medium">
          טיוטה — לא מפורסם
        </span>
      )}
    </div>
  );
}
