import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X, ArrowRight, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import RichTextEditor from "@/components/RichTextEditor";

export default function AdminSettings() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery();
  const { data: aboutContent, isLoading: aboutLoading } = trpc.about.get.useQuery();
  const { data: guestWriters, isLoading: writersLoading } = trpc.guestWriters.list.useQuery();

  const [siteTitle, setSiteTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutContent_, setAboutContent] = useState("");
  const [activeTab, setActiveTab] = useState<"site" | "about" | "writers">("site");

  useEffect(() => {
    if (settings) {
      setSiteTitle(settings.siteTitle || "");
      setHeroSubtitle(settings.heroSubtitle || "");
    }
  }, [settings]);

  useEffect(() => {
    if (aboutContent) {
      setAboutTitle(aboutContent.title || "");
      setAboutContent(aboutContent.content || "");
    }
  }, [aboutContent]);

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("הגדרות האתר עודכנו בהצלחה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בעדכון הגדרות");
    },
  });

  const updateAbout = trpc.about.update.useMutation({
    onSuccess: () => {
      utils.about.get.invalidate();
      toast.success("עמוד האודות עודכן בהצלחה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בעדכון עמוד האודות");
    },
  });

  const revokeWriter = trpc.guestWriters.revoke.useMutation({
    onSuccess: () => {
      utils.guestWriters.list.invalidate();
      utils.users.list.invalidate();
      toast.success("הרשאת הסופר האורח בוטלה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בביטול ההרשאה");
    },
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({ siteTitle, heroSubtitle });
  };

  const handleSaveAbout = () => {
    updateAbout.mutate({ title: aboutTitle, content: aboutContent_ });
  };

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

  if (settingsLoading || aboutLoading || writersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="font-display font-bold text-3xl text-foreground">הגדרות מנהל</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab("site")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "site"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          הגדרות אתר
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "about"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          עמוד אודות
        </button>
        <button
          onClick={() => setActiveTab("writers")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "writers"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          סופרים אורחים
        </button>
      </div>

      {/* Site Settings Tab */}
      {activeTab === "site" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">שם האתר</label>
            <Input
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="רוּחַ"
              dir="rtl"
              className="text-right"
            />
            <p className="text-xs text-muted-foreground mt-1">שם האתר המוצג בעמוד הבית וברחבי האתר</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">תיאור בעמוד הבית</label>
            <Textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="מרחב לעומק, לשקט ולחיפוש הפנימי — מאמרים ברוחניות, פילוסופיה וריפוי"
              dir="rtl"
              className="text-right resize-none min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">השורה מתחת לשם האתר בעמוד הבית</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={updateSettings.isPending}
              className="gap-2"
            >
              {updateSettings.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              שמור שינויים
            </Button>
          </div>
        </div>
      )}

      {/* About Page Tab */}
      {activeTab === "about" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">כותרת עמוד אודות</label>
            <Input
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              placeholder="אודות"
              dir="rtl"
              className="text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">תוכן עמוד אודות</label>
            <RichTextEditor value={aboutContent_} onChange={setAboutContent} />
            <p className="text-xs text-muted-foreground mt-2">אתה יכול להשתמש בעיצוב, תמונות וקישורים</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSaveAbout}
              disabled={updateAbout.isPending}
              className="gap-2"
            >
              {updateAbout.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              שמור שינויים
            </Button>
          </div>
        </div>
      )}

      {/* Guest Writers Tab */}
      {activeTab === "writers" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-foreground">סופרים אורחים מאושרים</h3>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/admin/users">
                <Users className="w-4 h-4" />
                ניהול משתמשים
              </Link>
            </Button>
          </div>

          {guestWriters && guestWriters.length > 0 ? (
            <div className="space-y-3">
              {guestWriters.map((writer) => (
                <div key={writer.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">{writer.name || "ללא שם"}</p>
                    <p className="text-sm text-muted-foreground">{writer.email || "—"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => revokeWriter.mutate({ userId: writer.id })}
                    disabled={revokeWriter.isPending}
                    className="gap-2"
                  >
                    {revokeWriter.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    ביטול אישור
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">
              אין סופרים אורחים מאושרים עדיין. <Link href="/admin/users" className="text-primary hover:underline">לחצו כאן</Link> כדי לאשר משתמשים.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
