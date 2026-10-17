import { Link, useParams, useLocation } from "wouter";
import { ArrowRight, BookOpen, Bell, ShoppingBag, ListOrdered, Paperclip, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { BOOK_STATUS_LABELS, PURCHASE_KIND_LABELS, bookCta } from "@shared/books";

/**
 * /book/:slug — דף ספר (site-pivot-books): כריכה, סטטוס, תקציר, תוכן עניינים,
 * פרקים לדוגמה, חומרי עזר, ואזור CTA (רכישה / "עדכנו אותי") לפי הסטטוס.
 */
export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { data: book, isLoading, error } = trpc.books.bySlug.useQuery({ slug: params.slug }, { retry: false });
  const { data: chapters } = trpc.articles.chaptersOfBook.useQuery(
    { bookId: book?.id ?? 0, role: "chapter" },
    { enabled: !!book?.id },
  );
  const { data: materials } = trpc.articles.chaptersOfBook.useQuery(
    { bookId: book?.id ?? 0, role: "material" },
    { enabled: !!book?.id },
  );
  useDocumentTitle(book ? `${book.title} – דרך הרוח` : undefined);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error || !book) {
    return (
      <div className="container py-24 text-center">
        <p className="text-2xl font-display font-bold text-foreground mb-2">הספר לא נמצא</p>
        <p className="text-muted-foreground mb-6">ייתכן שהכתובת שגויה או שהספר עדיין לא פורסם</p>
        <Button variant="outline" onClick={() => navigate("/books")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          לכל הספרים
        </Button>
      </div>
    );
  }

  const cta = bookCta(book.status, book.purchaseLinks);
  const itemHref = (slug: string) => `/book/${encodeURIComponent(book.slug)}/${encodeURIComponent(slug)}`;

  return (
    <div>
      <section className="hero-gradient py-14 px-4">
        <div className="container max-w-5xl">
          <Link href="/books" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            לכל הספרים
          </Link>
          <div className="grid md:grid-cols-[260px_1fr] gap-10 items-start">
            <div className="mx-auto md:mx-0 w-56 md:w-full">
              {book.coverImage ? (
                <img src={book.coverImage} alt={`כריכת הספר ${book.title}`} className="w-full rounded-xl shadow-xl ring-1 ring-border/40" />
              ) : (
                <div className="aspect-[2/3] rounded-xl bg-secondary/60 ring-1 ring-border/40 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold border border-primary/30 bg-primary/10 text-primary mb-4">
                {BOOK_STATUS_LABELS[book.status]}
              </span>
              <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground leading-tight mb-3">{book.title}</h1>
              {book.subtitle && <p className="text-xl text-muted-foreground font-light mb-4">{book.subtitle}</p>}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mb-6">
                {book.publisher && <span>{book.publisher}</span>}
                {book.year && <span>{book.year}</span>}
                {book.pages && <span>{book.pages} עמודים</span>}
              </div>

              {cta.kind === "buy" ? (
                <div className="flex flex-wrap gap-3">
                  {cta.links.map((l) => (
                    <Button key={l.url} asChild size="lg" className="gap-2">
                      <a href={l.url} target="_blank" rel="noopener noreferrer">
                        <ShoppingBag className="w-4 h-4" />
                        {l.label} · {PURCHASE_KIND_LABELS[l.kind]}
                      </a>
                    </Button>
                  ))}
                </div>
              ) : (
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <a href="#notify">
                    <Bell className="w-4 h-4" />
                    {cta.label}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container max-w-3xl py-12 space-y-14">
        {book.blurb && (
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4">על הספר</h2>
            <div className="prose-rtl max-w-none" dangerouslySetInnerHTML={{ __html: book.blurb }} />
          </section>
        )}

        {book.toc.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-primary" />תוכן העניינים
            </h2>
            <ol className="space-y-1.5 text-foreground/90 leading-relaxed list-none">
              {book.toc.map((line, i) => (
                <li key={i} className={line.startsWith("שער") ? "font-semibold mt-3" : "pr-4"}>{line}</li>
              ))}
            </ol>
          </section>
        )}

        {chapters && chapters.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />פרקים לדוגמה
            </h2>
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {chapters.map((c) => (
                <li key={c.id}>
                  <Link href={itemHref(c.slug)} className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-colors">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{c.chapterLabel || "פרק"}</span>
                    <span className="font-medium text-foreground">{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {materials && materials.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-primary" />חומרי עזר לספר
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {materials.map((m) => (
                <li key={m.id}>
                  <Link href={itemHref(m.slug)} className="block h-full rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all">
                    <span className="text-xs text-primary font-semibold">{m.chapterLabel || "חומר עזר"}</span>
                    <p className="font-medium text-foreground mt-1">{m.title}</p>
                    {m.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.excerpt}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cta.kind === "notify" && (
          <section id="notify" className="rounded-2xl border border-border bg-card p-8 text-center">
            <Bell className="w-6 h-6 text-primary mx-auto mb-3" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">{cta.label}</h2>
            <p className="text-muted-foreground mb-4">הירשמו לעדכונים ותקבלו הודעה כשהספר יוצא לאור.</p>
            <Button asChild><Link href="/#newsletter">הרשמה לעדכונים</Link></Button>
          </section>
        )}
      </div>
    </div>
  );
}
