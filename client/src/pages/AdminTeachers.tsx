import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowRight, ArrowUp, ArrowDown, Eye, EyeOff, Loader2, Pencil, Plus, Save, Trash2, ExternalLink, Link2, Unlink } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/RichTextEditor";
import { trpc } from "@/lib/trpc";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@shared/const";
import { EMPTY_TEACHER_FORM, slugifyName, teacherFormToInput, teacherToForm, type TeacherForm } from "./teachers/adminForm";

/** /admin/teachers — ניהול מורי השיטה: פרופיל, נראות, קישור לחשבון גוגל לפי מייל. */
export default function AdminTeachers() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: teachers, isLoading } = trpc.teachers.listAll.useQuery(undefined, { enabled: user?.role === "admin" });

  const [editingId, setEditingId] = useState<number | null | "new">(null);
  const [form, setForm] = useState<TeacherForm>(EMPTY_TEACHER_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const invalidate = () => { utils.teachers.listAll.invalidate(); utils.teachers.list.invalidate(); };
  const onErr = (e: { message?: string }) => toast.error(e.message || "שגיאה");
  const create = trpc.teachers.create.useMutation({ onSuccess: () => { invalidate(); toast.success("המורה נוסף"); setEditingId(null); }, onError: onErr });
  const update = trpc.teachers.update.useMutation({ onSuccess: () => { invalidate(); toast.success("הפרופיל עודכן"); setEditingId(null); }, onError: onErr });
  const quick = trpc.teachers.update.useMutation({ onSuccess: invalidate, onError: onErr });
  const remove = trpc.teachers.delete.useMutation({ onSuccess: () => { invalidate(); toast.success("המורה הוסר"); }, onError: onErr });
  const reorder = trpc.teachers.reorder.useMutation({ onSuccess: invalidate });
  const link = trpc.teachers.linkUser.useMutation({ onSuccess: () => { invalidate(); toast.success("החשבון קושר"); setLinkEmail(""); }, onError: onErr });
  const unlink = trpc.teachers.unlinkUser.useMutation({ onSuccess: () => { invalidate(); toast.success("הקישור הוסר"); }, onError: onErr });

  const set = <K extends keyof TeacherForm>(k: K, v: TeacherForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const startNew = () => { setForm(EMPTY_TEACHER_FORM); setSlugTouched(false); setEditingId("new"); };
  const startEdit = (t: NonNullable<typeof teachers>[number]) => { setForm(teacherToForm(t)); setSlugTouched(true); setEditingId(t.id); };
  const save = () => {
    const r = teacherFormToInput(form);
    if ("error" in r) { toast.error(r.error); return; }
    if (editingId === "new") create.mutate(r.input);
    else if (typeof editingId === "number") update.mutate({ id: editingId, ...r.input });
  };
  const move = (i: number, dir: -1 | 1) => {
    if (!teachers) return;
    const ids = teachers.map((t) => t.id); const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]]; reorder.mutate({ ids });
  };
  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { toast.error(`הקובץ גדול מדי — מקסימום ${MAX_UPLOAD_LABEL}`); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      set("photo", (await res.json()).url); toast.success("התמונה הועלתה");
    } catch { toast.error("שגיאה בהעלאת התמונה"); }
    finally { setUploading(false); if (photoRef.current) photoRef.current.value = ""; }
  };

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
  const editing = typeof editingId === "number" ? teachers?.find((t) => t.id === editingId) : undefined;

  return (
    <div className="container max-w-4xl py-12" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowRight className="w-5 h-5" /></Link></Button>
          <h1 className="font-display font-bold text-3xl text-foreground">מורים בשיטה</h1>
        </div>
        {editingId === null && <Button onClick={startNew} className="gap-2"><Plus className="w-4 h-4" />מורה חדש</Button>}
      </div>
      <p className="text-muted-foreground mb-8">
        מורה מופיע לציבור רק כשהוא "גלוי". קישור לחשבון גוגל (לפי המייל שבו המורה התחבר לאתר) מאפשר לו לערוך את
        הפרופיל ולכתוב ולפרסם מאמרים בעצמו. מייל "ליצירת קשר" לעולם אינו מוצג — טופס הקשר באתר שולח אליו.
      </p>
      <div className="divider-gold mb-8" />

      {editingId !== null ? (
        <div className="space-y-6">
          <div className={sectionCls}>
            <h2 className="font-display font-bold text-xl text-foreground">{editingId === "new" ? "מורה חדש" : `עריכה: ${form.name}`}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="שם *"><Input value={form.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugifyName(e.target.value)); }} /></Field>
              <Field label="slug (כתובת: /teacher/‹slug›)"><Input dir="ltr" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} /></Field>
              <Field label="שורת תיאור"><Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="מלווה בדרך הרוח, מטפל…" /></Field>
              <Field label="אזור / עיר"><Input value={form.area} onChange={(e) => set("area", e.target.value)} /></Field>
              <Field label="אופן ההוראה"><Input value={form.formats} onChange={(e) => set("formats", e.target.value)} placeholder="פרטני, קבוצתי, אונליין" /></Field>
              <Field label="אתר אישי"><Input dir="ltr" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
              <Field label="מייל ליצירת קשר (מוסתר)"><Input dir="ltr" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
              <Field label="מייל ציבורי (רק אם המורה ביקש)"><Input dir="ltr" value={form.publicEmail} onChange={(e) => set("publicEmail", e.target.value)} /></Field>
              <Field label="טלפון (רק אם המורה ביקש)"><Input dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2"><Switch checked={form.visible} onCheckedChange={(v) => set("visible", v)} /><span>גלוי באתר</span></label>
                <label className="flex items-center gap-2"><Switch checked={form.isFounder} onCheckedChange={(v) => set("isFounder", v)} /><span>המייסד</span></label>
              </div>
            </div>
          </div>

          <div className={sectionCls}>
            <h2 className="font-display font-bold text-lg text-foreground">תמונה</h2>
            {form.photo ? (
              <div className="flex items-start gap-4">
                <img src={form.photo} alt="" className="w-28 h-28 object-cover rounded-full shadow" />
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => photoRef.current?.click()} disabled={uploading}>החלפה</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => set("photo", "")}>הסרה</Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => photoRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "העלאת תמונה"}
              </Button>
            )}
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </div>

          <div className={sectionCls}>
            <h2 className="font-display font-bold text-lg text-foreground">על המורה</h2>
            <RichTextEditor value={form.bio} onChange={(v) => set("bio", v)} placeholder="מי אני, איך הגעתי לדרך, מה אני מציע…" />
            <Field label="ציטוט (משפט אחד)"><Textarea rows={2} value={form.quote} onChange={(e) => set("quote", e.target.value)} /></Field>
          </div>

          {editing && (
            <div className={sectionCls}>
              <h2 className="font-display font-bold text-lg text-foreground">חשבון מקושר</h2>
              {editing.userId ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">מקושר לחשבון #{editing.userId} — המורה יכול לערוך את הפרופיל ולפרסם מאמרים.</span>
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => unlink.mutate({ id: editing.id })}><Unlink className="w-4 h-4" />ניתוק</Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Input dir="ltr" className="max-w-xs" placeholder="המייל שבו המורה התחבר לאתר" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />
                  <Button type="button" variant="outline" size="sm" className="gap-1" disabled={!linkEmail || link.isPending}
                    onClick={() => link.mutate({ id: editing.id, email: linkEmail.trim() })}><Link2 className="w-4 h-4" />קישור</Button>
                  <span className="text-xs text-muted-foreground">המורה צריך להתחבר לאתר פעם אחת עם גוגל לפני הקישור.</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}שמירה</Button>
            <Button variant="outline" onClick={() => setEditingId(null)} disabled={saving}>ביטול</Button>
          </div>
        </div>
      ) : !teachers || teachers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">אין מורים עדיין — הוסיפו את הראשון (המייסד).</div>
      ) : (
        <ul className="space-y-3">
          {teachers.map((t, i) => (
            <li key={t.id} className="flex items-center gap-4 bg-card/60 border border-border/60 rounded-xl p-4">
              {t.photo ? <img src={t.photo} alt="" className="w-12 h-12 object-cover rounded-full" /> : <div className="w-12 h-12 rounded-full bg-secondary" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  {t.isFounder && <span className="text-xs rounded-full px-2 py-0.5 bg-primary/10 text-primary">המייסד</span>}
                  {!t.visible && <span className="text-xs rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300">מוסתר</span>}
                  {t.userId && <span className="text-xs rounded-full px-2 py-0.5 bg-secondary text-muted-foreground">מקושר</span>}
                </div>
                <div className="text-sm text-muted-foreground truncate">{[t.area, t.formats].filter(Boolean).join(" · ") || <span dir="ltr">/teacher/{t.slug}</span>}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="למעלה" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="למטה" disabled={i === teachers.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={t.visible ? "הסתרה" : "הצגה"} onClick={() => quick.mutate({ id: t.id, visible: !t.visible })}>
                  {t.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" aria-label="צפייה" asChild><a href={`/teacher/${encodeURIComponent(t.slug)}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
                <Button variant="ghost" size="icon" aria-label="עריכה" onClick={() => startEdit(t)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="הסרה" className="text-destructive" onClick={() => { if (confirm(`להסיר את ${t.name}? המאמרים נשארים.`)) remove.mutate({ id: t.id }); }}><Trash2 className="w-4 h-4" /></Button>
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
  return <div className="space-y-1.5"><Label className="text-sm font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
