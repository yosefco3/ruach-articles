import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X, ArrowRight, Users, Upload, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import RichTextEditor from "@/components/RichTextEditor";

export default function AdminSettings() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery();
  const { data: aboutContent, isLoading: aboutLoading } = trpc.about.get.useQuery();
  const { data: guestWriters, isLoading: writersLoading } = trpc.guestWriters.list.useQuery();

  const [siteTitle, setSiteTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutContent_, setAboutContent] = useState("");
  const [aboutImageUrl, setAboutImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
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
      setAboutImageUrl((aboutContent as any).imageUrl ?? null);
    }
  }, [aboutContent]);

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("הגדרות האתר עודכנו בהצלחה");
    },
    onError: (err) => toast.error(err.message || "שגיאה בעדכון הגדרות"),
  });

  const updateAbout = trpc.about.update.useMutation({
    onSuccess: () => {
      utils.about.get.invalidate();
      toast.success("עמוד האודות עודכן בהצלחה");
    },
    onError: (err) => toast.error(err.message || "שגיאה בעדכון עמוד האודות"),
  });

  const revokeWriter = trpc.guestWriters.revoke.useMutation({
    onSuccess: () => {
      utils.guestWriters.list.invalidate();
      utils.users.list.invalidate();
      toast.success("הרשאת הסופר האורח בוטלה");
    },
    onError: (err) => toast.error(err.message || "שגיאה בביטול ההרשאה"),
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({ siteTitle, heroSubtitle });
  };

  const handleSaveAbout = () => {
    updateAbout.mutate({
      title: aboutTitle,
      content: aboutContent_,
      imageUrl: aboutImageUrl ?? undefined,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      toast.error("הקובץ גדול מדי — מקסימום 10MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("ניתן להעלות קבצי תמונה בלבד");
      return;
    }

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "שגיאה בהעלאת התמונה");
      }

      const data = await response.json();
      setAboutImageUrl(data.url);
      toast.success("התמונה הועלתה בהצלחה");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהעלאת התמונה");
    } finally {
      setImageUploading(false);
      // Reset input so same file can be re-selected
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setAboutImageUrl(null);
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

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">תמונה ראשית</label>

            {aboutImageUrl ? (
              /* Image preview with remove button */
              <div className="relative group rounded-xl overflow-hidden border border-border bg-secondary/30">
                <img
                  src={aboutImageUrl}
                  alt="תמונת עמוד אודות"
                  className="w-full max-h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    className="gap-2 bg-background/90 hover:bg-background text-foreground border-border"
                    disabled={imageUploading}
                  >
                    {imageUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    החלף תמונה
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveImage}
                    className="gap-2 bg-background/90 hover:bg-background text-destructive border-border"
                  >
                    <Trash2 className="w-4 h-4" />
                    הסר
                  </Button>
                </div>
              </div>
            ) : (
              /* Upload dropzone */
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {imageUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">מעלה תמונה...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">לחצו להעלאת תמונה</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — עד 10MB</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="gap-2 pointer-events-none">
                      <Upload className="w-4 h-4" />
                      בחרו קובץ
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-xs text-muted-foreground mt-2">
              התמונה תוצג בראש עמוד האודות. ניתן גם להוסיף תמונות ישירות בתוך התוכן.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">תוכן עמוד אודות</label>
            <RichTextEditor value={aboutContent_} onChange={setAboutContent} />
            <p className="text-xs text-muted-foreground mt-2">
              ניתן להשתמש בעיצוב, תמונות וקישורים. להוספת קישור — סמנו טקסט ולחצו על כפתור הקישור בסרגל.
            </p>
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
              אין סופרים אורחים מאושרים עדיין.{" "}
              <Link href="/admin/users" className="text-primary hover:underline">לחצו כאן</Link>{" "}
              כדי לאשר משתמשים.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
