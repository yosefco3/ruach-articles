import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowRight, ArrowUp, ArrowDown, Eye, EyeOff, Loader2, Pencil, Plus, Save, Trash2, X, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { trpc } from "@/lib/trpc";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@shared/const";
import {
  BOOK_STATUSES, BOOK_STATUS_LABELS, PURCHASE_KINDS, PURCHASE_KIND_LABELS, type PurchaseKind,
} from "@shared/books";
import { EMPTY_BOOK_FORM, bookToForm, formToInput, slugifyTitle, type BookForm } from "./books/adminForm";

/**
 * /admin/books — ניהול הספרים (site-pivot-books). רשימה + טופס באותו דף.
 * ספר נראה בציבור רק כש-visible דלוק; סטטוס + קישורי רכישה קובעים את אזור ה-CTA בדף הספר.
 */
export default function AdminBooks() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: books, isLoading } = trpc.books.listAll.useQuery(undefined, { enabled: user?.role === "admin" });

  const [editingId, setEditingId] = useState<number | null | "new">(null);
  const [form, setForm] = useState<BookForm>(EMPTY_BOOK_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const invalidate = () => { utils.books.listAll.invalidate(); utils.books.list.invalidate(); };
  const create = trpc.books.create.useMutation({
    onSuccess: () => { invalidate(); toast.success("הספר נוצר"); setEditingId(null); },
    onError: (e) => toast.error(e.message || "שגיאה ביצירת הספר"),
  });
  const update = trpc.books.update.useMutation({
    onSuccess: () => { invalidate(); toast.success("הספר עודכן"); setEditingId(null); },
    onError: (e) => toast.error(e.message || "שגיאה בעדכון הספר"),
  });
  const quickUpdate = trpc.books.update.useMutation({
    onSuccess: invalidate, onError: (e) => toast.error(e.message || "שגיאה בעדכון"),
  });
  const remove = trpc.books.delete.useMutation({
    onSuccess: () => { invalidate(); toast.success("הספר נמחק"); },
    onError: (e) => toast.error(e.message || "שגיאה במחיקה"),
  });
  const reorder = trpc.books.reorder.useMutation({ onSuccess: invalidate });

  const set = <K extends keyof BookForm>(k: K, v: BookForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const startNew = () => { setForm(EMPTY_BOOK_FORM); setSlugTouched(false); setEditingId("new"); };
  const startEdit = (b: NonNullable<typeof books>[number]) => { setForm(bookToForm(b)); setSlugTouched(true); setEditingId(b.id); };

  const save = () => {
    const r = formToInput(form);
    if ("error" in r) { toast.error(r.error); return; }
    if (editingId === "new") create.mutate(r.input);
    else if (typeof editingId === "number") update.mutate({ id: editingId, ...r.input });
  };

  const move = (i: number, dir: -1 | 1) => {
    if (!books) return;
    const ids = books.map((b) => b.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder.mutate({ ids });
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { toast.error(`הקובץ גדול מדי — מקסימום ${MAX_UPLOAD_LABEL}`); return; }
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      set("coverImage", data.url);
      toast.success("הכריכה הועלתה");
    } catch {
      toast.error("שגיאה בהעלאת הכריכה");
    } finally {
      setCoverUploading(false);
      if (coverRef.current) coverRef.current.value = "";
    }
  };

  const setLink = (i: number, patch: Partial<{ label: string; url: string; kind: PurchaseKind }>) =>
    set("purchaseLinks", form.purchaseLinks.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  if (loading) return <Centered><Loader2 className="w-8 h-8 animate-spin text-primary" /></Centered>;
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-24 text-center">
        <p className="text-xl font-display font-bold text-foreground mb-2">גישה מוגבלת</p>
        <p className="text-muted-foreground mb-6">עמוד זה זמין למנהלים בלבד</p>
        <Button variant="outline" onClick={() => navigate("/")}>חזרה לדף הבית</Button>
      </div>
    );
  }
  if (isLoading) return <Centered><Loader2 className="w-8 h-8 animate-spin text-primary" /></Centered>;

  const saving = create.isPending || update.isPending;
  const sectionCls = "bg-card/60 border border-border/60 rounded-2xl p-6 space-y-4";

  return (
    <div className="container max-w-4xl py-12" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin"><ArrowRight className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-display font-bold text-3xl text-foreground">ניהול ספרים</h1>
        </div>
        {editingId === null && (
          <Button onClick={startNew} className="gap-2"><Plus className="w-4 h-4" />ספר חדש</Button>
        )}
      </div>
      <p className="text-muted-foreground mb-8">
        הספרים הם הקטגוריות של האתר. ספר מופיע לציבור רק כשהוא מסומן כ"גלוי"; הסטטוס וקישורי הרכישה
        קובעים מה מוצג בדף הספר (רכישה / "עדכנו אותי").
      </p>
      <div className="divider-gold mb-8" />

      {editingId !== null ? (
        <div className="space-y-6">
          <div className={sectionCls}>
            <h2 className="font-display font-bold text-xl text-foreground">
              {editingId === "new" ? "ספר חדש" : `עריכה: ${form.title}`}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="כותרת *">
                <Input value={form.title} onChange={(e) => {
                  set("title", e.target.value);
                  if (!slugTouched) set("slug", slugifyTitle(e.target.value));
                }} />
              </Field>
              <Field label="slug (כתובת: /book/‹slug›)">
                <Input dir="ltr" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
              </Field>
              <Field label="כותרת משנה">
                <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
              </Field>
              <Field label="הוצאה לאור">
                <Input value={form.publisher} onChange={(e) => set("publisher", e.target.value)} />
              </Field>
              <Field label="סטטוס">
                <Select value={form.status} onValueChange={(v) => set("status", v as BookForm["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOOK_STATUSES.map((s) => <SelectItem key={s} value={s}>{BOOK_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center gap-3 pt-6">
                <Switch id="visible" checked={form.visible} onCheckedChange={(v) => set("visible", v)} />
                <Label htmlFor="visible">גלוי באתר</Label>
              </div>
              <Field label="שנה"><Input dir="ltr" inputMode="numeric" value={form.year} onChange={(e) => set("year", e.target.value)} /></Field>
              <Field label="עמודים"><Input dir="ltr" inputMode="numeric" value={form.pages} onChange={(e) => set("pages", e.target.value)} /></Field>
              <Field label="ISBN"><Input dir="ltr" value={form.isbn} onChange={(e) => set("isbn", e.target.value)} /></Field>
            </div>
          </div>

          <div className={sectionCls}>
            <h2 className="font-display font-bold text-lg text-foreground">כריכה</h2>
            {form.coverImage ? (
              <div className="flex items-start gap-4">
                <img src={form.coverImage} alt="" className="w-32 rounded-lg shadow" />
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={coverUploading}>החלפה</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => set("coverImage", "")}>הסרה</Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => coverRef.current?.click()} disabled={coverUploading}>
                {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "העלאת כריכה"}
              </Button>
            )}
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />
          </div>

          <div className={sectionCls}>
            <h2 className="font-display font-bold text-lg text-foreground">תקציר הספר</h2>
            <RichTextEditor value={form.blurb} onChange={(v) => set("blurb", v)} placeholder="על מה הספר…" />
          </div>

          <div className={sectionCls}>
            <h2 className="font-display font-bold text-lg text-foreground">תוכן עניינים</h2>
            <p className="text-sm text-muted-foreground">שורה לכל שער/פרק (להצגה בלבד; פרקים לדוגמה נוצרים במאמרים).</p>
            <Textarea rows={8} value={form.tocText} onChange={(e) => set("tocText", e.target.value)} />
          </div>

          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-foreground">קישורי רכישה</h2>
              <Button type="button" variant="outline" size="sm" className="gap-1"
                onClick={() => set("purchaseLinks", [...form.purchaseLinks, { label: "", url: "", kind: "print" }])}>
                <Plus className="w-4 h-4" />קישור
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">מוצגים רק כשהסטטוס "זמין לרכישה". הוצאה, בוקפוד, "עברית"…</p>
            {form.purchaseLinks.map((l, i) => (
              <div key={i} className="grid md:grid-cols-[1fr_2fr_auto_auto] gap-2 items-center">
                <Input placeholder="שם (למשל: בוקפוד)" value={l.label} onChange={(e) => setLink(i, { label: e.target.value })} />
                <Input dir="ltr" placeholder="https://…" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} />
                <Select value={l.kind} onValueChange={(v) => setLink(i, { kind: v as PurchaseKind })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PURCHASE_KINDS.map((k) => <SelectItem key={k} value={k}>{PURCHASE_KIND_LABELS[k]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" aria-label="הסרת קישור"
                  onClick={() => set("purchaseLinks", form.purchaseLinks.filter((_, j) => j !== i))}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}שמירה
            </Button>
            <Button variant="outline" onClick={() => setEditingId(null)} disabled={saving}>ביטול</Button>
          </div>
        </div>
      ) : !books || books.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">אין ספרים עדיין — צרו את הראשון.</div>
      ) : (
        <ul className="space-y-3">
          {books.map((b, i) => (
            <li key={b.id} className="flex items-center gap-4 bg-card/60 border border-border/60 rounded-xl p-4">
              {b.coverImage ? <img src={b.coverImage} alt="" className="w-12 h-16 object-cover rounded" /> : <div className="w-12 h-16 rounded bg-secondary" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{b.title}</span>
                  <span className="text-xs rounded-full px-2 py-0.5 bg-secondary text-muted-foreground">{BOOK_STATUS_LABELS[b.status]}</span>
                  {!b.visible && <span className="text-xs rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300">מוסתר</span>}
                </div>
                <div className="text-sm text-muted-foreground truncate" dir="ltr">/book/{b.slug}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="למעלה" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="למטה" disabled={i === books.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={b.visible ? "הסתרה" : "הצגה"}
                  onClick={() => quickUpdate.mutate({ id: b.id, visible: !b.visible })}>
                  {b.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" aria-label="צפייה" asChild>
                  <a href={`/book/${encodeURIComponent(b.slug)}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                </Button>
                <Button variant="ghost" size="icon" aria-label="עריכה" onClick={() => startEdit(b)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="מחיקה" className="text-destructive"
                  onClick={() => { if (confirm(`למחוק את "${b.title}"?`)) remove.mutate({ id: b.id }); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center min-h-[60vh]">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
