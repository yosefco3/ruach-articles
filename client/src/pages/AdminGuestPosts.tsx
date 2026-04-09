import { useState } from "react";
import { Loader2, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useDynamicCategories } from "@/hooks/useDynamicCategories";

export default function AdminGuestPosts() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const { getCategoryLabel } = useDynamicCategories();

  const { data: guestPosts, isLoading, refetch } = trpc.guestPosts.list.useQuery({ status: activeTab });

  const approveMutation = trpc.guestPosts.approve.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("ההצעה אושרה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה באישור");
    },
  });

  const rejectMutation = trpc.guestPosts.reject.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("ההצעה נדחתה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בדחייה");
    },
  });

  const deleteMutation = trpc.guestPosts.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("ההצעה נמחקה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה במחיקה");
    },
  });

  const tabs = [
    { value: "pending", label: "בהמתנה", count: guestPosts?.filter(p => p.status === "pending").length || 0 },
    { value: "approved", label: "אושרו", count: guestPosts?.filter(p => p.status === "approved").length || 0 },
    { value: "rejected", label: "נדחו", count: guestPosts?.filter(p => p.status === "rejected").length || 0 },
  ];

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="font-display font-bold text-3xl text-foreground mb-8">הצעות מאמרים אורחים</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !guestPosts || guestPosts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>אין הצעות {activeTab === "pending" ? "בהמתנה" : activeTab === "approved" ? "מאושרות" : "מדוחות"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {guestPosts.map((post) => (
            <div key={post.id} className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-lg text-foreground mb-1">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    מאת: {post.authorName} ({post.authorEmail})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    קטגוריה: {getCategoryLabel(post.category)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  post.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  post.status === "approved" ? "bg-green-100 text-green-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {post.status === "pending" ? "בהמתנה" : post.status === "approved" ? "אושר" : "נדחה"}
                </span>
              </div>

              <div className="bg-muted/50 rounded p-4 max-h-40 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap">{post.body}</p>
              </div>

              {activeTab === "pending" && (
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectMutation.mutate({ id: post.id })}
                    disabled={rejectMutation.isPending}
                    className="gap-2 text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                    דחה
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate({ id: post.id })}
                    disabled={approveMutation.isPending}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    אשר
                  </Button>
                </div>
              )}

              {(activeTab === "approved" || activeTab === "rejected") && (
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ id: post.id })}
                    disabled={deleteMutation.isPending}
                    className="gap-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    מחק
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
