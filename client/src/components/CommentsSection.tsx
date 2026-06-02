import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Heart, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface Comment {
  id: number;
  articleId: number;
  userId: number;
  body: string;
  parentCommentId?: number | null;
  createdAt: Date;
  userName?: string;
}

export default function CommentsSection({ articleId }: { articleId: number }) {
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const { data: comments, isLoading, refetch } = trpc.comments.list.useQuery({ articleId });
  const createCommentMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      setNewComment("");
      setReplyingTo(null);
      setReplyBody("");
      refetch();
      toast.success("התגובה נוספה בהצלחה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בהוספת תגובה");
    },
  });

  const deleteCommentMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("התגובה נמחקה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה במחיקת תגובה");
    },
  });

  const likeMutation = trpc.likes.toggle.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) {
      toast.error("אנא כתוב תגובה");
      return;
    }
    createCommentMutation.mutate({ articleId, body: newComment, siteUrl: window.location.origin });
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyBody.trim()) {
      toast.error("אנא כתוב תגובה");
      return;
    }
    createCommentMutation.mutate({ articleId, body: replyBody, parentCommentId: parentId, siteUrl: window.location.origin });
  };

  const parentComments = comments?.filter((c) => !(c as any).parentCommentId || (c as any).parentCommentId === null) ?? [];
  const getReplies = (commentId: number) => comments?.filter((c) => (c as any).parentCommentId === commentId) ?? [];

  return (
    <div className="space-y-8">
      <h2 className="font-display font-bold text-2xl text-foreground">תגובות ({comments?.length || 0})</h2>

      {/* New Comment Form */}
      {isAuthenticated ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-foreground">הוסף תגובה</h3>
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="כתוב את דעתך..."
            dir="rtl"
            className="text-right resize-none"
            rows={4}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={createCommentMutation.isPending}
              className="gap-2"
            >
              {createCommentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              שלח תגובה
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-accent/20 border border-accent/30 rounded-xl p-6 text-center">
          <p className="text-foreground mb-4">כדי להוסיף תגובה, אנא התחבר</p>
          <Button asChild>
            <a href={getLoginUrl()}>התחברות</a>
          </Button>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : parentComments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>אין תגובות עדיין. היה הראשון להגיב!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {parentComments.map((comment) => {
            const replies = getReplies(comment.id);
            return (
              <div key={comment.id} className="space-y-4">
                {/* Parent Comment */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{comment.userName || "משתמש"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { locale: he, addSuffix: true })}
                      </p>
                    </div>
                    {user && (String(comment.userId) === String(user.id) || user.role === "admin") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCommentMutation.mutate({ id: comment.id })}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">{comment.body}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={() => likeMutation.mutate({ commentId: comment.id })}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span>אהבתי</span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>הגב</span>
                    </button>
                  </div>
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && isAuthenticated && (
                  <div className="mr-8 bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-3">
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="כתוב תגובה..."
                      dir="rtl"
                      className="text-right resize-none text-sm"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyBody("");
                        }}
                      >
                        ביטול
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={createCommentMutation.isPending}
                      >
                        {createCommentMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        שלח תגובה
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="mr-8 space-y-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="bg-muted/30 border border-border/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground">{reply.userName || "משתמש"}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(reply.createdAt), { locale: he, addSuffix: true })}
                            </p>
                          </div>
                          {user && (String(reply.userId) === String(user.id) || user.role === "admin") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCommentMutation.mutate({ id: reply.id })}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-foreground text-sm leading-relaxed">{reply.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
