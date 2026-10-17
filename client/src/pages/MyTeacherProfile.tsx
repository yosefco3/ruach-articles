import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowRight, Loader2, Save, ExternalLink } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@shared/const";
import { getLoginUrl } from "@/const";

/** /my-teacher-profile — מורה מקושר עורך את הפרופיל הציבורי שלו (לא נראות/slug — אלה של האדמין). */
export default function MyTeacherProfile() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const { data: me, isLoading } = trpc.teachers.me.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const [form, setForm] = useState({ photo: "", tagline: "", area: "", formats: "", bio: "", quote: "", website: "", publicEmail: "", phone: "", contactEmail: "" });
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (me) setForm({ photo: me.photo ?? "", tagline: me.tagline, area: me.area, formats: me.formats, bio: me.bio ?? "", quote: me.quote ?? "",
      website: me.website, publicEmail: me.publicEmail, phone: me.phone, contactEmail: me.contactEmail });
  }, [me?.id]);
  const update = trpc.teachers.updateMe.useMutation({
    onSuccess: () => { utils.teachers.me.invalidate(); utils.teachers.bySlug.invalidate(); toast.success("הפרופיל נשמר"); },
    onError: (e) => toast.error(e.message || "שגיאה בשמירה"),
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { toast.error(`הקובץ גדול מדי — מקסימום ${MAX_UPLOAD_LABEL}`); return; }
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const res = await fetch("/api/upload", { method: "POST", body: fd }); if (!res.ok) throw new Error(); set("photo", (await res.json()).url); }
    catch { toast.error("שגיאה בהעלאת התמונה"); } finally { setUploading(false); }
  };

  if (loading || (isAuthenticated && isLoading)) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAuthenticated) {
    return <div className="container py-24 text-center"><p className="text-muted-foreground mb-4">יש להתחבר כדי לערוך את פרופיל המורה.</p><Button asChild><a href={getLoginUrl()}>התחברות</a></Button></div>;
  }
  if (!me) {
    return <div className="container py-24 text-center"><p className="text-xl font-display font-bold text-foreground mb-2">החשבון שלך אינו מקושר לפרופיל מורה</p><p className="text-muted-foreground">פנו למנהל האתר כדי לקשר את החשבון.</p></div>;
  }

  const save = () => {
    if (form.website && !/^https?:\/\/\S+$/i.test(form.website)) { toast.error("כתובת האתר חייבת להתחיל ב-http(s)://"); return; }
    update.mutate({ ...form, photo: form.photo || null, bio: form.bio || null, quote: form.quote || null });
  };
  const sectionCls = "bg-card/60 border border-border/60 rounded-2xl p-6 space-y-4";

  return (
    <div className="container max-w-3xl py-12" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/"><ArrowRight className="w-5 h-5" /></Link></Button>
          <h1 className="font-display font-bold text-3xl text-foreground">הפרופיל שלי כמורה</h1>
        </div>
        <Button variant="outline" size="sm" asChild><a href={`/teacher/${encodeURIComponent(me.slug)}`} target="_blank" rel="noreferrer" className="gap-1"><ExternalLink className="w-4 h-4" />הדף שלי</a></Button>
      </div>
      <p className="text-muted-foreground mb-8">{me.visible ? "הפרופיל גלוי באתר." : "הפרופיל עדיין מוסתר — מנהל האתר יפרסם אותו."}</p>
      <div className="space-y-6">
        <div className={sectionCls}>
          <div className="grid md:grid-cols-2 gap-4">
            <F label="שורת תיאור"><Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} /></F>
            <F label="אזור / עיר"><Input value={form.area} onChange={(e) => set("area", e.target.value)} /></F>
            <F label="אופן ההוראה"><Input value={form.formats} onChange={(e) => set("formats", e.target.value)} placeholder="פרטני, קבוצתי, אונליין" /></F>
            <F label="אתר אישי"><Input dir="ltr" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></F>
            <F label="מייל לקבלת פניות (לא מוצג באתר)"><Input dir="ltr" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></F>
            <F label="מייל ציבורי (אם תרצה שיוצג)"><Input dir="ltr" value={form.publicEmail} onChange={(e) => set("publicEmail", e.target.value)} /></F>
            <F label="טלפון (אם תרצה שיוצג)"><Input dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></F>
          </div>
        </div>
        <div className={sectionCls}>
          <h2 className="font-display font-bold text-lg text-foreground">תמונה</h2>
          <div className="flex items-center gap-4">
            {form.photo ? <img src={form.photo} alt="" className="w-24 h-24 rounded-full object-cover" /> : <div className="w-24 h-24 rounded-full bg-secondary" />}
            <Button type="button" variant="outline" size="sm" onClick={() => photoRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "העלאת תמונה"}</Button>
            {form.photo && <Button type="button" variant="ghost" size="sm" onClick={() => set("photo", "")}>הסרה</Button>}
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </div>
        </div>
        <div className={sectionCls}>
          <h2 className="font-display font-bold text-lg text-foreground">עליי</h2>
          <RichTextEditor value={form.bio} onChange={(v) => set("bio", v)} />
          <F label="ציטוט (משפט אחד)"><Textarea rows={2} value={form.quote} onChange={(e) => set("quote", e.target.value)} /></F>
        </div>
        <Button onClick={save} disabled={update.isPending} className="gap-2">{update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}שמירה</Button>
      </div>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
