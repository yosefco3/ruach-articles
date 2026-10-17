import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowRight, Users, MapPin, Globe, Mail, Phone, Loader2, Send, Quote } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ArticleCard from "@/components/ArticleCard";

/** /teacher/:slug — דף מורה: פרופיל, מאמרים, וטופס קשר דרך האתר (המייל נשאר מוסתר). */
export default function TeacherPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { data: teacher, isLoading, error } = trpc.teachers.bySlug.useQuery({ slug: params.slug }, { retry: false });
  const { data: articles } = trpc.teachers.articlesOf.useQuery({ teacherId: teacher?.id ?? 0 }, { enabled: !!teacher?.id });
  useDocumentTitle(teacher ? `${teacher.name} – מורים בשיטה – דרך הרוח` : undefined);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const send = trpc.contact.toTeacher.useMutation({
    onSuccess: (r) => { if (r.success) { setSent(true); toast.success(r.message); } else toast.error(r.message); },
    onError: (e) => toast.error(e.message || "שגיאה בשליחה"),
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !teacher) {
    return (
      <div className="container py-24 text-center">
        <p className="text-2xl font-display font-bold text-foreground mb-2">המורה לא נמצא</p>
        <Button variant="outline" onClick={() => navigate("/teachers")}><ArrowRight className="w-4 h-4 ml-2" />לכל המורים</Button>
      </div>
    );
  }

  return (
    <div>
      <section className="hero-gradient py-14 px-4">
        <div className="container max-w-4xl">
          <Link href="/teachers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />לכל המורים
          </Link>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {teacher.photo ? (
              <img src={teacher.photo} alt={teacher.name} className="w-40 h-40 rounded-full object-cover ring-4 ring-primary/20 shadow-xl shrink-0" />
            ) : (
              <div className="w-40 h-40 rounded-full bg-secondary flex items-center justify-center shrink-0"><Users className="w-14 h-14 text-muted-foreground/50" /></div>
            )}
            <div className="text-center md:text-right">
              {teacher.isFounder && <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold border border-primary/30 bg-primary/10 text-primary mb-3">מייסד השיטה</span>}
              <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground leading-tight mb-2">{teacher.name}</h1>
              {teacher.tagline && <p className="text-xl text-muted-foreground font-light mb-4">{teacher.tagline}</p>}
              <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {teacher.area && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{teacher.area}</span>}
                {teacher.formats && <span>{teacher.formats}</span>}
                {teacher.website && <a href={teacher.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe className="w-4 h-4" />אתר אישי</a>}
                {teacher.publicEmail && <a href={`mailto:${teacher.publicEmail}`} className="flex items-center gap-1 text-primary hover:underline"><Mail className="w-4 h-4" />{teacher.publicEmail}</a>}
                {teacher.phone && <a href={`tel:${teacher.phone}`} className="flex items-center gap-1 text-primary hover:underline" dir="ltr"><Phone className="w-4 h-4" />{teacher.phone}</a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container max-w-3xl py-12 space-y-14">
        {teacher.quote && (
          <blockquote className="relative rounded-2xl border border-primary/20 bg-primary/5 p-6 text-lg leading-relaxed text-foreground/90">
            <Quote className="w-5 h-5 text-primary/60 absolute top-4 left-4" />{teacher.quote}
          </blockquote>
        )}
        {teacher.bio && (
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">על {teacher.name}</h2>
            <div className="prose-rtl max-w-none" dangerouslySetInnerHTML={{ __html: teacher.bio }} />
          </section>
        )}
        {articles && articles.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-6">כתבים</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {articles.map((a) => <ArticleCard key={a.id} {...a} />)}
            </div>
          </section>
        )}
        {teacher.hasContact && (
          <section id="contact" className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">יצירת קשר עם {teacher.name}</h2>
            <p className="text-muted-foreground mb-6">ההודעה נשלחת ישירות למורה דרך האתר.</p>
            {sent ? (
              <p className="text-primary font-medium">ההודעה נשלחה. תודה!</p>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); send.mutate({ teacherId: teacher.id, ...form }); }}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input required placeholder="השם שלך" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="שם" />
                  <Input required type="email" dir="ltr" placeholder="המייל שלך" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="דוא״ל" />
                </div>
                <Textarea required rows={5} placeholder="ההודעה" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} aria-label="הודעה" />
                <Button type="submit" disabled={send.isPending} className="gap-2">{send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}שליחה</Button>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
