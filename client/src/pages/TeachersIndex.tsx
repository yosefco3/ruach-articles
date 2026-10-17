import { Link } from "wouter";
import { Users, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** /teachers — מורי שיטת דרך הרוח. */
export default function TeachersIndex() {
  const { data: teachers } = trpc.teachers.list.useQuery();
  useDocumentTitle("מורים בשיטה – דרך הרוח");

  return (
    <div>
      <section className="hero-gradient py-16 px-4 text-center">
        <div className="container">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-3">מורים בשיטה</h1>
          <div className="divider-gold max-w-xs mx-auto mb-4" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
            אנשים שמלמדים ומלווים בדרך הרוח — כל אחד בדרכו, באזורו ובכתיבתו.
          </p>
        </div>
      </section>
      <div className="container max-w-5xl py-12">
        {!teachers || teachers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            רשימת המורים תתפרסם בקרוב.
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((t) => (
              <li key={t.id}>
                <Link href={`/teacher/${encodeURIComponent(t.slug)}`} className="group flex flex-col items-center text-center h-full rounded-2xl border border-border bg-card p-6 hover:shadow-xl transition-all">
                  {t.photo ? (
                    <img src={t.photo} alt={t.name} loading="lazy" className="w-28 h-28 rounded-full object-cover ring-2 ring-primary/20 mb-4" />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-secondary flex items-center justify-center mb-4"><Users className="w-10 h-10 text-muted-foreground/50" /></div>
                  )}
                  {t.isFounder && <span className="text-xs font-semibold text-primary mb-1">מייסד השיטה</span>}
                  <h2 className="font-display font-bold text-xl text-foreground">{t.name}</h2>
                  {t.tagline && <p className="text-sm text-muted-foreground mt-1">{t.tagline}</p>}
                  {(t.area || t.formats) && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      {t.area && <><MapPin className="w-3 h-3" />{t.area}</>}{t.area && t.formats && " · "}{t.formats}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
