import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowRight,
  Mail,
  Users,
  UserCheck,
  UserX,
  Search,
  Trash2,
} from "lucide-react";
import { useLocation } from "wouter";
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

export default function AdminNewsletter() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: subscribers, isLoading } = trpc.newsletter.list.useQuery(
    { search: search.trim() || undefined },
    { enabled: isAdmin }
  );

  const deleteMutation = trpc.newsletter.delete.useMutation({
    onMutate: ({ id }) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      utils.newsletter.list.invalidate();
    },
  });

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-12">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-foreground mb-4">
            אין גישה
          </h1>
          <p className="text-muted-foreground mb-6">
            רק מנהלים יכולים לצפות ברשימת הניוזלטר.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  // Stats are always based on full list (no search filter)
  const activeCount = subscribers?.filter((s) => s.active).length ?? 0;
  const inactiveCount = (subscribers?.length ?? 0) - activeCount;

  return (
    <div className="container py-10 max-w-3xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            ניהול ניוזלטר
          </h1>
          <p className="text-sm text-muted-foreground">
            צפייה, חיפוש ומחיקה של מנויים
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-display font-bold text-foreground">
            {subscribers?.length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">סה״כ מנויים</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <UserCheck className="w-5 h-5 mx-auto mb-2 text-green-400" />
          <p className="text-2xl font-display font-bold text-foreground">
            {activeCount}
          </p>
          <p className="text-xs text-muted-foreground">פעילים</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <UserX className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-display font-bold text-foreground">
            {inactiveCount}
          </p>
          <p className="text-xs text-muted-foreground">לא פעילים</p>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            רשימת מנויים
          </h2>
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי אימייל..."
              className="pr-9 text-sm"
              dir="ltr"
            />
          </div>
        </div>

        {subscribers && subscribers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    דוא״ל
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    שם
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    תאריך הרשמה
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td
                      className="px-6 py-3 text-sm text-foreground font-mono"
                      dir="ltr"
                    >
                      {sub.email}
                    </td>
                    <td className="px-6 py-3 text-sm text-foreground">
                      {sub.name || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          sub.active
                            ? "bg-green-900/40 text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sub.active ? "פעיל" : "לא פעיל"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {new Date(sub.subscribedAt).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-6 py-3 text-left">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={deletingId === sub.id}
                          >
                            {deletingId === sub.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת מנוי</AlertDialogTitle>
                            <AlertDialogDescription>
                              האם למחוק את <strong>{sub.email}</strong> מרשימת
                              הניוזלטר? פעולה זו אינה ניתנת לביטול.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() =>
                                deleteMutation.mutate({ id: sub.id })
                              }
                            >
                              מחק
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Mail className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            {search ? (
              <p className="text-muted-foreground">
                לא נמצאו מנויים עם האימייל "{search}".
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  אין מנויים לניוזלטר עדיין.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  טופס ההרשמה מופיע בדף הבית של האתר.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
