import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, UserCheck, UserX, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminUsers() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: allUsers, isLoading: usersLoading } = trpc.users.list.useQuery();

  const approveMutation = trpc.guestWriters.approve.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      utils.guestWriters.list.invalidate();
      toast.success("המשתמש אושר כסופר אורח");
    },
    onError: (err) => toast.error(err.message || "שגיאה באישור המשתמש"),
  });

  const revokeMutation = trpc.guestWriters.revoke.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      utils.guestWriters.list.invalidate();
      toast.success("ההרשאה הוסרה");
    },
    onError: (err) => toast.error(err.message || "שגיאה בהסרת ההרשאה"),
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
        <p className="text-xl font-display font-bold text-foreground mb-2">גישה מוגבלת</p>
        <p className="text-muted-foreground mb-6">עמוד זה זמין למנהלים בלבד</p>
        <Button variant="outline" onClick={() => navigate("/")}>חזרה לדף הבית</Button>
      </div>
    );
  }

  const filteredUsers = allUsers?.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">ניהול משתמשים</h1>
          <p className="text-sm text-muted-foreground">אשרו או הסירו הרשאות כתיבה למשתמשים</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם או אימייל..."
          className="pr-10 text-right"
          dir="rtl"
        />
      </div>

      {/* Users Table */}
      {usersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>לא נמצאו משתמשים</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-right p-4 font-medium text-muted-foreground">שם</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">אימייל</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">תפקיד</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">סטטוס כתיבה</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {u.role === "admin" && <Shield className="w-4 h-4 text-primary" />}
                        <span className="font-medium text-foreground">{u.name || "ללא שם"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground" dir="ltr">{u.email || "—"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {u.role === "admin" ? "מנהל" : "משתמש"}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role === "admin" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : u.guestPostApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <UserCheck className="w-3 h-3" />
                          מאושר
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                          לא מאושר
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {u.role !== "admin" && (
                        u.guestPostApproved ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revokeMutation.mutate({ userId: u.id })}
                            disabled={revokeMutation.isPending}
                            className="gap-1 text-destructive hover:bg-destructive/10"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            הסר הרשאה
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate({ userId: u.id })}
                            disabled={approveMutation.isPending}
                            className="gap-1 text-green-600 hover:bg-green-50"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            אשר כסופר
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 text-center">
        סה״כ {filteredUsers.length} משתמשים {search && `(מסונן מתוך ${allUsers?.length || 0})`}
      </p>
    </div>
  );
}
