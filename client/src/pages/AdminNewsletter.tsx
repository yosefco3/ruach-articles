import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Mail, Users, UserCheck, UserX } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminNewsletter() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();

  const isAdmin = user?.role === "admin";

  const { data: subscribers, isLoading } = trpc.newsletter.list.useQuery(undefined, {
    enabled: isAdmin,
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
          <h1 className="font-display font-bold text-2xl text-foreground mb-4">אין גישה</h1>
          <p className="text-muted-foreground mb-6">רק מנהלים יכולים לצפות ברשימת הניוזלטר.</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  const activeCount = subscribers?.filter((s) => s.active).length ?? 0;
  const inactiveCount = (subscribers?.length ?? 0) - activeCount;

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">ניהול ניוזלטר</h1>
          <p className="text-sm text-muted-foreground">צפייה ברשימת המנויים לניוזלטר</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-display font-bold text-foreground">{subscribers?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">סה״כ מנויים</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <UserCheck className="w-5 h-5 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-display font-bold text-foreground">{activeCount}</p>
          <p className="text-xs text-muted-foreground">פעילים</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <UserX className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-display font-bold text-foreground">{inactiveCount}</p>
          <p className="text-xs text-muted-foreground">לא פעילים</p>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            רשימת מנויים
          </h2>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-3 text-sm text-foreground font-mono" dir="ltr">
                      {sub.email}
                    </td>
                    <td className="px-6 py-3 text-sm text-foreground">
                      {sub.name || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          sub.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {sub.active ? "פעיל" : "לא פעיל"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {new Date(sub.subscribedAt).toLocaleDateString("he-IL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Mail className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">אין מנויים לניוזלטר עדיין.</p>
            <p className="text-sm text-muted-foreground mt-1">
              טופס ההרשמה מופיע בדף הבית של האתר.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
