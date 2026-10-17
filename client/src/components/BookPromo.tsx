import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BOOK_STATUS_LABELS } from "@shared/books";

/**
 * תיבת קידום ספר בתחתית הכלים (טארוט / אי-צ'ינג / המדריך / דפי הקלפים) ודף הדרך.
 * מציגה את הספר הראשון הגלוי (סדר האדמין); בלי ספר גלוי — לא מרנדרת דבר.
 * אינה נוגעת בפרומפטים או בלוגיקת הקריאה.
 */
export default function BookPromo({ lead }: { lead?: string }) {
  const { data: books } = trpc.books.list.useQuery();
  const book = books?.[0];
  if (!book) return null;
  const href = `/book/${encodeURIComponent(book.slug)}`;
  return (
    <section aria-label="הספר" className="container max-w-3xl my-12">
      <Link
        href={href}
        className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 hover:bg-primary/10 transition-colors"
      >
        {book.coverImage ? (
          <img src={book.coverImage} alt={`כריכת הספר ${book.title}`} loading="lazy" className="w-24 rounded-lg shadow-lg shrink-0" />
        ) : (
          <div className="w-24 h-36 rounded-lg bg-secondary flex items-center justify-center shrink-0"><BookOpen className="w-8 h-8 text-muted-foreground/50" /></div>
        )}
        <div className="text-center sm:text-right">
          <span className="text-xs font-semibold text-primary">{lead ?? "הכלים באתר נולדו מתוך הספר"} · {BOOK_STATUS_LABELS[book.status]}</span>
          <p className="font-display font-bold text-2xl text-foreground mt-1">{book.title}</p>
          {book.subtitle && <p className="text-muted-foreground mt-1">{book.subtitle}</p>}
          <span className="inline-block mt-3 text-sm font-medium text-primary underline underline-offset-4">לדף הספר</span>
        </div>
      </Link>
    </section>
  );
}
