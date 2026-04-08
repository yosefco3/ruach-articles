import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminUsers() {
  const { data: users, isLoading } = trpc.auth.me.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const approveWriter = trpc.guestWriters.approve.useMutation({
    onSuccess: () => {
      toast.success("המשתמש אושר כסופר אורח");
      trpc.useUtils().guestWriters.list.invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "שגיאה באישור המשתמש");
    },
  });

  const revokeWriter = trpc.guestWriters.revoke.useMutation({
    onSuccess: () => {
      toast.success("הרשאת הסופר האורח בוטלה");
      trpc.useUtils().guestWriters.list.invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "שגיאה בביטול ההרשאה");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="font-display font-bold text-3xl text-foreground mb-8">ניהול משתמשים</h1>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="חיפוש משתמשים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            dir="rtl"
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            אתה יכול לאשר משתמשים כסופרים אורחים, מה שיאפשר להם לכתוב מאמרים ישירות בדומה לאדמין.
          </p>

          {/* TODO: This would need to fetch all users from the database */}
          <div className="text-center py-8 text-muted-foreground">
            <p>ניהול משתמשים זקוק לעדכון ב-API — כרגע רק סופרים אורחים מאושרים מוצגים בהגדרות</p>
          </div>
        </div>
      </div>
    </div>
  );
}
