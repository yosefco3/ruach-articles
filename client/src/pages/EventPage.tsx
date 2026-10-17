import { Link, useParams, useLocation } from "wouter";
import { CalendarDays, MapPin, Ticket, Loader2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { formatEventWhen, formatEventWhere } from "./events/format";

/** /event/:slug — דף אירוע. */
export default function EventPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { data: e, isLoading, error } = trpc.events.bySlug.useQuery({ slug: params.slug }, { retry: false });
  const { data: teacher } = trpc.teachers.list.useQuery(undefined, { enabled: !!e?.teacherId });
  const host = teacher?.find((t) => t.id === e?.teacherId);
  useDocumentTitle(e ? `${e.title} – אירועים – דרך הרוח` : undefined);
  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !e) {
    return (
      <div className="container py-24 text-center">
        <p className="text-2xl font-display font-bold text-foreground mb-2">האירוע לא נמצא</p>
        <Button variant="outline" onClick={() => navigate("/events")}><ArrowRight className="w-4 h-4 ml-2" />לכל האירועים</Button>
      </div>
    );
  }
  return (
    <div>
      <section className="hero-gradient py-14 px-4">
        <div className="container max-w-3xl">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />לכל האירועים
          </Link>
          {e.coverImage && <img src={e.coverImage} alt="" className="w-full max-h-80 object-cover rounded-2xl shadow-xl mb-8" />}
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground leading-tight mb-5">{e.title}</h1>
          <div className="space-y-2 text-muted-foreground">
            <p className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" />{formatEventWhen(e.startsAt, e.endsAt)}</p>
            <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />{formatEventWhere(e)}</p>
            {host && <p className="flex items-center gap-2">בהנחיית <Link href={`/teacher/${encodeURIComponent(host.slug)}`} className="text-primary hover:underline">{host.name}</Link></p>}
            {e.price && <p className="font-medium text-foreground">{e.price}</p>}
          </div>
          {e.registrationUrl && (
            <Button asChild size="lg" className="mt-6 gap-2"><a href={e.registrationUrl} target="_blank" rel="noopener noreferrer"><Ticket className="w-4 h-4" />הרשמה</a></Button>
          )}
        </div>
      </section>
      {e.description && (
        <div className="container max-w-3xl py-12">
          <div className="prose-rtl max-w-none" dangerouslySetInnerHTML={{ __html: e.description }} />
        </div>
      )}
    </div>
  );
}
