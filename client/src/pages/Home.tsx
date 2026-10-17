import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Loader2, Mail, Send, BookOpen, Sparkles, WandSparkles, Users, Compass, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ArticleCard from "@/components/ArticleCard";
import { BOOK_STATUS_LABELS } from "@shared/books";

/**
 * דף הבית של אתר שיטת "דרך הרוח" (site-pivot-books): השיטה → הספרים → הכלים → המורים → עדכונים.
 * מדורים ריקים (ספרים/מורים לפני פרסום) לא מוצגים.
 */
export default function Home() {
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: books } = trpc.books.list.useQuery();
  const { data: teachers } = trpc.teachers.list.useQuery();
  const { data: articles } = trpc.articles.list.useQuery();
  const siteTitle = settings?.siteTitle || "דרך הרוח";
  useDocumentTitle(`${siteTitle} – הנבואה הטבעית: ספרים, קריאות ומורים`);

  const teacherArticles = (articles ?? []).filter((a) => a.teacherId != null).slice(0, 3);

  const [nlEmail, setNlEmail] = useState("");
  const [nlName, setNlName] = useState("");
  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => { toast.success("נרשמת בהצלחה לעדכונים!"); setNlEmail(""); setNlName(""); },
    onError: (err) => toast.error(err.message || "שגיאה בהרשמה"),
  });
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail.trim()) { toast.error("אנא הזינו כתובת דוא״ל"); return; }
    subscribe.mutate({ email: nlEmail, name: nlName || undefined });
  };

  const sectionHeader = (title: string, href?: string, linkLabel?: string) => (
    <div className="flex items-center gap-3 mb-8">
      <h2 className="text-2xl font-display font-bold text-foreground">{title}</h2>
      <div className="flex-1 h-px bg-border" />
      {href && linkLabel && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {linkLabel}<ArrowLeft className="w-4 h-4" />
        </Link>
      )}
    </div>
  );

  return (
    <div>
      {/* ── Hero: the method ── */}
      <section className="hero-gradient py-20 px-4">
        <div className="container text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Compass className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-foreground mb-4 leading-tight">{siteTitle}</h1>
          <div className="divider-gold max-w-xs mx-auto mb-6" />
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            {settings?.heroSubtitle || "הנבואה הטבעית — הקשר החי, הישיר והבלתי-מתווך של האדם אל האל"}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2"><Link href="/derech"><Compass className="w-4 h-4" />מהי דרך הרוח</Link></Button>
            <Button asChild size="lg" variant="outline" className="gap-2"><Link href="/books"><BookOpen className="w-4 h-4" />הספרים</Link></Button>
          </div>
        </div>
      </section>

      {/* ── Books ── */}
      {books && books.length > 0 && (
        <section className="container py-16">
          {sectionHeader("הספרים", "/books", "לכל הספרים")}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((b) => (
              <Link key={b.id} href={`/book/${encodeURIComponent(b.slug)}`} className="group block rounded-2xl border border-border bg-card p-5 hover:shadow-xl transition-all">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary/50 mb-4 ring-1 ring-border/40">
                  {b.coverImage ? (
                    <img src={b.coverImage} alt={`כריכת הספר ${b.title}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-12 h-12 text-muted-foreground/40" /></div>
                  )}
                </div>
                <span className="text-xs font-semibold text-primary">{BOOK_STATUS_LABELS[b.status]}</span>
                <h3 className="font-display font-bold text-xl text-foreground mt-1">{b.title}</h3>
                {b.subtitle && <p className="text-sm text-muted-foreground mt-1">{b.subtitle}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Tools: readings ── */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          {sectionHeader("כלים נלווים")}
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/tarot" className="group flex items-start gap-5 rounded-2xl border border-border bg-card p-6 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><WandSparkles className="w-6 h-6 text-primary" /></div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground mb-1">קריאה בקלפי טארוט</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">שליפת קלפים מחפיסה מקורית, פירוש לכל קלף ופירוש מותאם לשאלה — מראה סמלית להבנת המצב, בלי ניבוי.</p>
              </div>
            </Link>
            <Link href="/iching" className="group flex items-start gap-5 rounded-2xl border border-border bg-card p-6 hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><Sparkles className="w-6 h-6 text-primary" /></div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground mb-1">קריאה באי צ'ינג</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">הטלת שלושה מטבעות, הקסגרמה ראשית ונגזרת, ופירוש חי בעברית מתוך ספר התמורות.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Teachers ── */}
      {teachers && teachers.length > 0 && (
        <section className="container py-16">
          {sectionHeader("מורים בשיטה", "/teachers", "לכל המורים")}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teachers.slice(0, 4).map((t) => (
              <Link key={t.id} href={`/teacher/${encodeURIComponent(t.slug)}`} className="flex flex-col items-center text-center rounded-2xl border border-border bg-card p-6 hover:shadow-xl transition-all">
                {t.photo ? <img src={t.photo} alt={t.name} loading="lazy" className="w-24 h-24 rounded-full object-cover ring-2 ring-primary/20 mb-3" />
                  : <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-3"><Users className="w-8 h-8 text-muted-foreground/50" /></div>}
                {t.isFounder && <span className="text-xs font-semibold text-primary">מייסד השיטה</span>}
                <h3 className="font-display font-bold text-lg text-foreground">{t.name}</h3>
                {t.tagline && <p className="text-xs text-muted-foreground mt-1">{t.tagline}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Latest from the teachers ── */}
      {teacherArticles.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container">
            {sectionHeader("חדש מהמורים")}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherArticles.map((a) => <ArticleCard key={a.id} {...a} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section id="newsletter" className="py-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="container max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 text-center shadow-sm">
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"><Mail className="w-6 h-6 text-primary" /></div>
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">עדכונים על הספרים</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">הירשמו ותקבלו הודעה כשספר יוצא לאור, ועדכונים מהמורים והכלים.</p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Input type="text" aria-label="שם (אופציונלי)" placeholder="שם (אופציונלי)" value={nlName} onChange={(e) => setNlName(e.target.value)} dir="rtl" className="sm:w-1/3" />
              <Input type="email" aria-label="כתובת דוא״ל" placeholder="כתובת דוא״ל" value={nlEmail} onChange={(e) => setNlEmail(e.target.value)} dir="ltr" className="flex-1" required />
              <Button type="submit" disabled={subscribe.isPending} className="gap-2 whitespace-nowrap">
                {subscribe.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}הרשמה
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">ניתן לבטל את המנוי בכל עת. אנו מכבדים את הפרטיות שלכם.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
