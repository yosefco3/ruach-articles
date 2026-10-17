import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { BOOK_STATUS_LABELS } from "@shared/books";

/** /books — כל הספרים הגלויים של שיטת דרך הרוח. */
export default function BooksIndex() {
  const { data: books } = trpc.books.list.useQuery();
  useDocumentTitle("הספרים – דרך הרוח");

  return (
    <div>
      <section className="hero-gradient py-16 px-4 text-center">
        <div className="container">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-3">הספרים</h1>
          <div className="divider-gold max-w-xs mx-auto mb-4" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
            שיטת דרך הרוח בכתב — תקצירים, תוכן עניינים, פרקים לדוגמה וחומרי עזר.
          </p>
        </div>
      </section>
      <div className="container max-w-5xl py-12">
        {!books || books.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            הספרים בדרך — בקרוב.
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={`/book/${encodeURIComponent(b.slug)}`} className="group block h-full rounded-2xl border border-border bg-card p-5 hover:shadow-xl transition-all">
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary/50 mb-4 ring-1 ring-border/40">
                    {b.coverImage ? (
                      <img src={b.coverImage} alt={`כריכת הספר ${b.title}`} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-12 h-12 text-muted-foreground/40" /></div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-primary">{BOOK_STATUS_LABELS[b.status]}</span>
                  <h2 className="font-display font-bold text-xl text-foreground mt-1">{b.title}</h2>
                  {b.subtitle && <p className="text-sm text-muted-foreground mt-1">{b.subtitle}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
