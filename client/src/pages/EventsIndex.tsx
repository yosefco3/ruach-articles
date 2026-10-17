import { Link, useLocation } from "wouter";
import { CalendarDays, MapPin, Loader2, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { formatEventWhen, formatEventWhere } from "./events/format";

/** /events — סדנאות ומפגשים (מוצג רק כשהמדור דלוק בהגדרות). */
export default function EventsIndex() {
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.events.list.useQuery();
  useDocumentTitle("אירועים – דרך הרוח");
  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!data?.visible) {
    return (
      <div className="container py-24 text-center">
        <p className="text-2xl font-display font-bold text-foreground mb-2">הדף לא נמצא</p>
        <Button variant="outline" onClick={() => navigate("/")}><ArrowRight className="w-4 h-4 ml-2" />חזרה לדף הבית</Button>
      </div>
    );
  }
  const Card = ({ e }: { e: (typeof data.upcoming)[number] }) => (
    <Link href={`/event/${encodeURIComponent(e.slug)}`} className="flex gap-5 rounded-2xl border border-border bg-card p-5 hover:shadow-xl transition-all">
      {e.coverImage && <img src={e.coverImage} alt="" loading="lazy" className="w-28 h-28 object-cover rounded-xl shrink-0" />}
      <div>
        <h2 className="font-display font-bold text-xl text-foreground">{e.title}</h2>
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{formatEventWhen(e.startsAt, e.endsAt)}</p>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="w-4 h-4" />{formatEventWhere(e)}</p>
        {e.price && <p className="text-sm text-primary font-medium mt-2">{e.price}</p>}
      </div>
    </Link>
  );
  return (
    <div>
      <section className="hero-gradient py-16 px-4 text-center">
        <div className="container">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-3">אירועים</h1>
          <div className="divider-gold max-w-xs mx-auto mb-4" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">סדנאות, מפגשים והרצאות של שיטת דרך הרוח.</p>
        </div>
      </section>
      <div className="container max-w-3xl py-12 space-y-12">
        <section>
          <h2 className="font-display font-bold text-2xl text-foreground mb-5">בקרוב</h2>
          {data.upcoming.length === 0 ? <p className="text-muted-foreground">אין אירועים קרובים כרגע — הירשמו לעדכונים בדף הבית.</p>
            : <div className="space-y-4">{data.upcoming.map((e) => <Card key={e.id} e={e} />)}</div>}
        </section>
        {data.past.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-2xl text-foreground mb-5">אירועים שהיו</h2>
            <div className="space-y-4 opacity-80">{data.past.map((e) => <Card key={e.id} e={e} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
