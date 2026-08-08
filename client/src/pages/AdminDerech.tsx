import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  DEFAULT_DERECH_CONTENT,
  type DerechContent,
  type DerechPrinciple,
} from "@shared/derech";

/**
 * /admin/derech — עורך מובנה לדף "דרך הרוח" (/derech).
 * העיצוב קבוע בקוד; כאן עורכים את הטקסטים בלבד. תחביר בתוך טקסט:
 * **מודגש** וקישור [טקסט](/article/slug).
 */
export default function AdminDerech() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.derech.get.useQuery();
  const [content, setContent] = useState<DerechContent>(DEFAULT_DERECH_CONTENT);

  // התוכן השמור, וכשאין — ברירת המחדל המובנית (שהיא גם מה שהדף מציג בפועל).
  useEffect(() => {
    if (!isLoading) setContent(data ?? DEFAULT_DERECH_CONTENT);
  }, [data, isLoading]);

  const update = trpc.derech.update.useMutation({
    onSuccess: () => {
      utils.derech.get.invalidate();
      toast.success("דף הדרך עודכן בהצלחה");
    },
    onError: (err) => toast.error(err.message || "שגיאה בעדכון דף הדרך"),
  });

  const set = <K extends keyof DerechContent>(key: K, value: DerechContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }));

  const setPrinciple = (i: number, patch: Partial<DerechPrinciple>) =>
    setContent((c) => ({
      ...c,
      principles: c.principles.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    }));

  const movePrinciple = (i: number, dir: -1 | 1) =>
    setContent((c) => {
      const j = i + dir;
      if (j < 0 || j >= c.principles.length) return c;
      const arr = [...c.principles];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...c, principles: arr };
    });

  const removePrinciple = (i: number) =>
    setContent((c) => ({ ...c, principles: c.principles.filter((_, j) => j !== i) }));

  const addPrinciple = () =>
    setContent((c) => ({
      ...c,
      principles: [...c.principles, { title: "עיקרון חדש", law: "", body: "" }],
    }));

  const handleSave = () => {
    const trimmed: DerechContent = {
      ...content,
      opening: content.opening.map((s) => s.trim()).filter(Boolean),
      inItems: content.inItems.map((s) => s.trim()).filter(Boolean),
      outItems: content.outItems.map((s) => s.trim()).filter(Boolean),
    };
    if (trimmed.principles.some((p) => !p.title.trim() || !p.law.trim() || !p.body.trim())) {
      toast.error("לכל עיקרון נדרשים כותרת, ניסוח-חוק והסבר");
      return;
    }
    update.mutate(trimmed);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sectionCls =
    "bg-card/60 border border-border/60 rounded-2xl p-6 space-y-4";
  const labelCls = "block text-sm font-medium text-muted-foreground mb-1.5";

  return (
    <div className="container max-w-4xl py-12" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-display font-bold text-3xl text-foreground">
            עריכת דף הדרך
          </h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/derech" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            צפייה בדף
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-8 mr-12">
        תחביר בתוך הטקסטים: <code dir="ltr">**מודגש**</code> וקישור{" "}
        <code dir="ltr">[טקסט](/article/slug)</code>. העיצוב עצמו קבוע — כאן עורכים
        את התוכן בלבד.
      </p>

      <div className="space-y-8">
        {/* ── כותרות ── */}
        <section className={sectionCls}>
          <h2 className="font-display font-bold text-xl text-foreground">כותרת הדף</h2>
          <div>
            <label className={labelCls}>כותרת ראשית</label>
            <Input value={content.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>כותרת משנה (בזהב)</label>
            <Input value={content.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>שורת הסבר קטנה</label>
            <Input value={content.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </div>
        </section>

        {/* ── פתיח ── */}
        <section className={sectionCls}>
          <h2 className="font-display font-bold text-xl text-foreground">פסקאות הפתיח</h2>
          <p className="text-sm text-muted-foreground">פסקה בכל שורה ריקה (שורה ריקה מפרידה בין פסקאות).</p>
          <Textarea
            rows={10}
            value={content.opening.join("\n\n")}
            onChange={(e) =>
              set(
                "opening",
                e.target.value.split(/\n\s*\n/)
              )
            }
          />
        </section>

        {/* ── עקרונות ── */}
        <section className={sectionCls}>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-foreground">העקרונות</h2>
            <Button variant="outline" size="sm" onClick={addPrinciple} className="gap-1.5">
              <Plus className="w-4 h-4" />
              הוספת עיקרון
            </Button>
          </div>
          <div>
            <label className={labelCls}>כותרת החלק</label>
            <Input
              value={content.principlesTitle}
              onChange={(e) => set("principlesTitle", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>שורת משנה לחלק</label>
            <Input
              value={content.principlesSubtitle}
              onChange={(e) => set("principlesSubtitle", e.target.value)}
            />
          </div>

          {content.principles.map((p, i) => (
            <div key={i} className="border border-border/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-primary">עיקרון {i + 1}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => movePrinciple(i, -1)} disabled={i === 0}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => movePrinciple(i, 1)}
                    disabled={i === content.principles.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrinciple(i)}
                    disabled={content.principles.length <= 1}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className={labelCls}>כותרת</label>
                <Input value={p.title} onChange={(e) => setPrinciple(i, { title: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>ניסוח-החוק (השורה המודגשת)</label>
                <Textarea rows={2} value={p.law} onChange={(e) => setPrinciple(i, { law: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>הסבר</label>
                <Textarea rows={4} value={p.body} onChange={(e) => setPrinciple(i, { body: e.target.value })} />
              </div>
            </div>
          ))}
        </section>

        {/* ── בפנים / בחוץ ── */}
        <section className={sectionCls}>
          <h2 className="font-display font-bold text-xl text-foreground">מה נכנס — ומה נשאר בחוץ</h2>
          <div>
            <label className={labelCls}>כותרת החלק</label>
            <Input value={content.inOutTitle} onChange={(e) => set("inOutTitle", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>שורת משנה לחלק</label>
            <Input
              value={content.inOutSubtitle}
              onChange={(e) => set("inOutSubtitle", e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>"בפנים" — פריט בכל שורה</label>
              <Textarea
                rows={8}
                value={content.inItems.join("\n")}
                onChange={(e) => set("inItems", e.target.value.split("\n"))}
              />
            </div>
            <div>
              <label className={labelCls}>"בחוץ" — פריט בכל שורה</label>
              <Textarea
                rows={8}
                value={content.outItems.join("\n")}
                onChange={(e) => set("outItems", e.target.value.split("\n"))}
              />
            </div>
          </div>
        </section>

        {/* ── סיום ── */}
        <section className={sectionCls}>
          <h2 className="font-display font-bold text-xl text-foreground">סיום</h2>
          <div>
            <label className={labelCls}>ציטוט הסיום</label>
            <Textarea
              rows={3}
              value={content.closingQuote}
              onChange={(e) => set("closingQuote", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>השורה שמעל כפתור "לכל המאמרים"</label>
            <Input value={content.closingCta} onChange={(e) => set("closingCta", e.target.value)} />
          </div>
        </section>

        {/* ── שמירה ── */}
        <div className="flex justify-end gap-3">
          <Button onClick={handleSave} disabled={update.isPending} className="gap-2">
            {update.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            שמירת הדף
          </Button>
        </div>
      </div>
    </div>
  );
}
