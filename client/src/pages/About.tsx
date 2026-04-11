import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Feather } from "lucide-react";

export default function About() {
  const { data: aboutContent, isLoading } = trpc.about.get.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const imageUrl = (aboutContent as any)?.imageUrl as string | null | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = aboutContent?.title || "אודות";
  const subtitle = settings?.heroSubtitle || "";
  const siteTitle = settings?.siteTitle || "רוּחַ חָכְמָה";

  return (
    <div className="min-h-screen" dir="rtl">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Subtle dot-grid background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.72 0.12 75) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container max-w-3xl pt-10 pb-14 relative">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            חזרה לדף הבית
          </Link>

          {/* Centered hero */}
          <div className="flex flex-col items-center text-center gap-5">
            {/* Icon medallion */}
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
              <Feather className="w-7 h-7 text-primary" />
            </div>

            <div>
              <h1 className="font-display font-bold text-5xl md:text-6xl text-foreground tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 text-lg text-muted-foreground font-serif">
                  {subtitle}
                </p>
              )}
              <p className="mt-1 text-sm text-primary/70 font-medium tracking-wide">
                {siteTitle}
              </p>
            </div>

            {/* Gold divider */}
            <div className="w-32 divider-gold mt-2" />
          </div>
        </div>
      </div>

      {/* ── Unified card: image + text ────────────────────────── */}
      <div className="container max-w-3xl pb-20">
        <div className="relative bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          {/* Cover image inside the card */}
          {imageUrl && (
            <div className="overflow-hidden">
              <img
                src={imageUrl}
                alt={title}
                className="w-full max-h-[420px] object-cover"
              />
              {/* Subtle gradient fade from image into card body */}
              <div className="h-8 bg-gradient-to-b from-transparent to-card/60 -mt-8 relative z-10" />
            </div>
          )}

          <div className="p-8 md:p-12">
            {aboutContent?.content ? (
              <div
                className="prose-rtl max-w-none"
                dangerouslySetInnerHTML={{ __html: aboutContent.content }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  תוכן זה עדיין לא הוגדר.{" "}
                  <Link href="/" className="text-primary hover:underline">
                    חזרו לדף הבית
                  </Link>{" "}
                  ותתחילו לקרוא מאמרים!
                </p>
              </div>
            )}
          </div>

          {/* Bottom accent bar */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <div className="divider-gold mb-8 mx-auto max-w-xs" />
          <p className="text-muted-foreground text-sm mb-4">
            מוזמנים לקרוא את המאמרים
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            לכל המאמרים
          </Link>
        </div>
      </div>
    </div>
  );
}
