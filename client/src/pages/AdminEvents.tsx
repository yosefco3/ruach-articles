import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Loader2, Pencil, Plus, Save, Trash2, ExternalLink, CalendarDays } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { trpc } from "@/lib/trpc";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@shared/const";
import { formatEventWhen, fromLocalInput, toLocalInput } from "./events/format";
import { slugifyName } from "./teachers/adminForm";

type Form = {
  slug: string; title: string; description: string; startsAt: string; endsAt: string; location: string; isOnline: boolean;
  registrationUrl: string; price: string; teacherId: string; bookId: string; coverImage: string; published: boolean;
};
const EMPTY: Form = { slug: "", title: "", description: "", startsAt: "", endsAt: "", location: "", isOnline: false,
  registrationUrl: "", price: "", teacherId: "", bookId: "", coverImage: "", published: false };

/** /admin/events — ניהול אירועים. המדור הציבורי נסתר עד שמדליקים "מדור אירועים" בהגדרות האתר. */
export default function AdminEvents() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  const { data: events, isLoading } = trpc.events.listAll.useQuery(undefined, { enabled: isAdmin });
  const { data: teachers } = trpc.teachers.listAll.useQuery(undefined, { enabled: isAdmin });
  const { data: books } = trpc.books.listAll.useQuery(undefined, { enabled: isAdmin });
  const { data: settings } = trpc.settings.get.useQuery();

  const [editingId, setEditingId] = useState<number | null | "new">(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const invalidate = () => { utils.events.listAll.invalidate(); utils.events.list.invalidate(); };
  const onErr = (e: { message?: string }) => toast.error(e.message || "שגיאה");
  const create = trpc.events.create.useMutation({ onSuccess: () => { invalidate(); toast.success("האירוע נוצר"); setEditingId(null); }, onError: onErr });
  const update = trpc.events.update.useMutation({ onSuccess: () => { invalidate(); toast.success("האירוע עודכן"); setEditingId(null); }, onError: onErr });
  const quick = trpc.events.update.useMutation({ onSuccess: invalidate, onError: onErr });
  const remove = trpc.events.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("האירוע נמחק"); }, onError: onErr });

  const startNew = () => { setForm(EMPTY); setSlugTouched(false); setEditingId("new"); };
  const startEdit = (e: NonNullable<typeof events>[number]) => {
    setForm({ slug: e.slug, title: e.title, description: e.description ?? "", startsAt: toLocalInput(e.startsAt), endsAt: toLocalInput(e.endsAt),
      location: e.location, isOnline: e.isOnline, registrationUrl: e.registrationUrl, price: e.price,
      teacherId: e.teacherId == null ? "" : String(e.teacherId), bookId: e.bookId == null ? "" : String(e.bookId),
      coverImage: e.coverImage ?? "", published: e.published });
    setSlugTouched(true); setEditingId(e.id);
  };
  const save = () => {
    const title = form.title.trim(); const slug = form.slug.trim() || slugifyName(title);
    const startsAt = fromLocalInput(form.startsAt);
    if (!title) return void toast.error("נדרשת כותרת");
    if (!startsAt) return void toast.error("נדרש מועד התחלה");
    if (form.registrationUrl && !/^https?:\/\/\S+$/i.test(form.registrationUrl)) return void toast.error("קישור ההרשמה חייב להתחיל ב-http(s)://");
    const input = {
      slug, title, description: form.description || null, startsAt, endsAt: fromLocalInput(form.endsAt), location: form.location.trim(),
      isOnline: form.isOnline, registrationUrl: form.registrationUrl.trim(), price: form.price.trim(),
      teacherId: form.teacherId ? Number(form.teacherId) : null, bookId: form.bookId ? Number(form.bookId) : null,
      coverImage: form.coverImage || null, published: form.published,
    };
    if (editingId === "new") create.mutate(input); else if (typeof editingId === "number") update.mutate({ id: editingId, ...input });
  };
  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { toast.error(`הקובץ גדול מדי — מקסימום ${MAX_UPLOAD_LABEL}`); return; }
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const r = await fetch("/api/upload", { method: "POST", body: fd }); if (!r.ok) throw new Error(); set("coverImage", (await r.json()).url); }
    catch { toast.error("שגיאה בהעלאה"); } finally { setUploading(false); if (coverRef.current) coverRef.current.value = ""; }
  };

  if (loading) return <Centered><Loader2 className="w-8 h-8 animate-spin text-primary" /></Centered>;
  if (!isAuthenticated || !isAdmin) {
    return <div className="container py-24 text-center"><p className="text-xl font-display font-bold text-foreground mb-2">גישה מוגבלת</p><Button variant="outline" onClick={() => navigate("/")}>חזרה לדף הבית</Button></div>;
  }
  if (isLoading) return <Centered><Loader2 className="w-8 h-8 animate-spin text-primary" /></Centered>;
  const saving = create.isPending || update.isPending;
  const sectionCls = "bg-card/60 border border-border/60 rounded-2xl p-6 space-y-4";

  return (
    <div className="container max-w-4xl py-12" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowRight className="w-5 h-5" /></Link></Button>
          <h1 className="font-display font-bold text-3xl text-foreground">אירועים</h1>
        </div>
        {editingId === null && <Button onClick={startNew} className="gap-2"><Plus className="w-4 h-4" />אירוע חדש</Button>}
      </div>
      <p className="text-muted-foreground mb-2">סדנאות, מפגשים והרצאות. אירוע מופיע לציבור רק כשהוא מפורסם <strong>וגם</strong> מדור האירועים דלוק.</p>
      <p className={`text-sm mb-8 ${settings?.eventsVisible ? "text-green-600 dark:text-green-400" : "text-amber-700 dark:text-amber-300"}`}>
        מדור האירועים כרגע {settings?.eventsVisible ? "גלוי" : "נסתר"} — <Link href="/admin/settings" className="underline">שינוי בהגדרות האתר</Link>.
      </p>
      <div className="divider-gold mb-8" />

      {editingId !== null ? (
        <div className="space-y-6">
          <div className={sectionCls}>
            <div className="grid md:grid-cols-2 gap-4">
              <F label="כותרת *"><Input value={form.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugifyName(e.target.value)); }} /></F>
              <F label="slug (כתובת: /event/‹slug›)"><Input dir="ltr" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} /></F>
              <F label="התחלה *"><Input type="datetime-local" dir="ltr" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></F>
              <F label="סיום"><Input type="datetime-local" dir="ltr" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></F>
              <F label="מקום"><Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="ירושלים, בית X / זום" /></F>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2"><Switch checked={form.isOnline} onCheckedChange={(v) => set("isOnline", v)} /><span>אונליין</span></label>
                <label className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(v) => set("published", v)} /><span>מפורסם</span></label>
              </div>
              <F label="קישור להרשמה"><Input dir="ltr" value={form.registrationUrl} onChange={(e) => set("registrationUrl", e.target.value)} placeholder="https://" /></F>
              <F label="מחיר"><Input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="חינם / 120 ₪" /></F>
              <F label="מנחה">
                <Select value={form.teacherId || "none"} onValueChange={(v) => set("teacherId", v === "none" ? "" : v)}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{(teachers ?? []).map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </F>
              <F label="סביב ספר">
                <Select value={form.bookId || "none"} onValueChange={(v) => set("bookId", v === "none" ? "" : v)}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{(books ?? []).map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.title}</SelectItem>)}</SelectContent>
                </Select>
              </F>
            </div>
          </div>
          <div className={sectionCls}>
            <h2 className="font-display font-bold text-lg text-foreground">תמונה</h2>
            <div className="flex items-center gap-4">
              {form.coverImage ? <img src={form.coverImage} alt="" className="w-40 rounded-lg" /> : <div className="w-40 h-24 rounded-lg bg-secondary" />}
              <Button type="button" variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "העלאה"}</Button>
              {form.coverImage && <Button type="button" variant="ghost" size="sm" onClick={() => set("coverImage", "")}>הסרה</Button>}
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />
            </div>
          </div>
          <div className={sectionCls}>
            <h2 className="font-display font-bold text-lg text-foreground">תיאור</h2>
            <RichTextEditor value={form.description} onChange={(v) => set("description", v)} />
          </div>
          <div className="flex gap-3">
            <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}שמירה</Button>
            <Button variant="outline" onClick={() => setEditingId(null)} disabled={saving}>ביטול</Button>
          </div>
        </div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />אין אירועים עדיין.</div>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-4 bg-card/60 border border-border/60 rounded-xl p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{e.title}</span>
                  {!e.published && <span className="text-xs rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300">טיוטה</span>}
                  {e.isOnline && <span className="text-xs rounded-full px-2 py-0.5 bg-secondary text-muted-foreground">אונליין</span>}
                </div>
                <div className="text-sm text-muted-foreground">{formatEventWhen(e.startsAt, e.endsAt)}{e.location ? ` · ${e.location}` : ""}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label={e.published ? "הסתרה" : "פרסום"} onClick={() => quick.mutate({ id: e.id, published: !e.published })}>
                  {e.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" aria-label="צפייה" asChild><a href={`/event/${encodeURIComponent(e.slug)}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
                <Button variant="ghost" size="icon" aria-label="עריכה" onClick={() => startEdit(e)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="מחיקה" className="text-destructive" onClick={() => { if (confirm(`למחוק את "${e.title}"?`)) remove.mutate({ id: e.id }); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function Centered({ children }: { children: React.ReactNode }) { return <div className="flex items-center justify-center min-h-[60vh]">{children}</div>; }
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
