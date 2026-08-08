import { Link } from "wouter";
import {
  ArrowLeft,
  Compass,
  Sprout,
  Link2,
  Scale,
  Globe,
  Music,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DEFAULT_DERECH_CONTENT, type DerechContent } from "@shared/derech";
import { renderMdLite } from "@/lib/mdLite";

/**
 * /derech — the site's method page: "דרך הרוח — הנבואה הטבעית".
 * Content is editable in /admin/derech (stored as structured JSON in derechPage);
 * when nothing is stored the built-in DEFAULT_DERECH_CONTENT renders, so the
 * page never breaks. Layout/design stay fixed in code.
 */

/** אייקוני העקרונות לפי סדר; עיקרון מעבר לרשימה מקבל את האחרון. */
const PRINCIPLE_ICONS = [Sprout, Link2, Scale, Globe, Music];

export default function Derech() {
  const { data } = trpc.derech.get.useQuery();
  const content: DerechContent = data ?? DEFAULT_DERECH_CONTENT;

  return (
    <div className="min-h-screen" dir="rtl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.72 0.12 75) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container max-w-3xl pt-10 pb-14 relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            חזרה לדף הבית
          </Link>

          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
              <Compass className="w-7 h-7 text-primary" />
            </div>

            <div>
              <h1 className="font-display font-bold text-5xl md:text-6xl text-foreground tracking-tight leading-tight">
                {content.title}
              </h1>
              {content.tagline && (
                <p className="mt-3 text-xl text-primary font-serif">{content.tagline}</p>
              )}
              {content.subtitle && (
                <p className="mt-2 text-sm text-muted-foreground">{content.subtitle}</p>
              )}
            </div>

            <div className="w-32 divider-gold mt-2" />
          </div>
        </div>
      </div>

      <div className="container max-w-3xl pb-20 space-y-14">
        {/* ── Opening ── */}
        <section className="prose-rtl max-w-none text-lg leading-relaxed">
          {content.opening.map((para, i) => (
            <p key={i}>{renderMdLite(para)}</p>
          ))}
        </section>

        {/* ── Principles ── */}
        <section>
          <h2 className="font-display font-bold text-3xl text-foreground text-center mb-2">
            {content.principlesTitle}
          </h2>
          {content.principlesSubtitle && (
            <p className="text-center text-muted-foreground mb-8">
              {content.principlesSubtitle}
            </p>
          )}

          <div className="space-y-5">
            {content.principles.map((p, i) => {
              const Icon = PRINCIPLE_ICONS[Math.min(i, PRINCIPLE_ICONS.length - 1)];
              return (
                <div
                  key={i}
                  className="relative bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl shadow-lg shadow-black/10 overflow-hidden"
                >
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-11 h-11 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-primary/60 font-display font-bold text-lg">
                            {i + 1}.
                          </span>
                          <h3 className="font-display font-bold text-xl text-foreground">
                            {p.title}
                          </h3>
                        </div>
                        <p className="mt-2 text-primary/90 font-medium leading-relaxed">
                          {p.law}
                        </p>
                        <p className="mt-3 text-muted-foreground leading-relaxed">
                          {renderMdLite(p.body)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── In / Out ── */}
        <section>
          <h2 className="font-display font-bold text-3xl text-foreground text-center mb-2">
            {content.inOutTitle}
          </h2>
          {content.inOutSubtitle && (
            <p className="text-center text-muted-foreground mb-8">{content.inOutSubtitle}</p>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card/60 border border-primary/30 rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-primary mb-4 text-center">
                בפנים
              </h3>
              <ul className="space-y-3">
                {content.inItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-sm leading-relaxed text-foreground/90"
                  >
                    <span className="text-primary shrink-0 mt-0.5">✓</span>
                    {renderMdLite(item)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card/40 border border-border/60 rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-muted-foreground mb-4 text-center">
                בחוץ
              </h3>
              <ul className="space-y-3">
                {content.outItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="shrink-0 mt-0.5">✕</span>
                    {renderMdLite(item)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Closing ── */}
        <section className="text-center">
          <div className="divider-gold mb-10 mx-auto max-w-xs" />
          {content.closingQuote && (
            <blockquote className="font-serif text-xl md:text-2xl text-foreground/90 leading-relaxed max-w-2xl mx-auto">
              {renderMdLite(content.closingQuote)}
            </blockquote>
          )}
          {content.closingCta && (
            <p className="mt-8 text-muted-foreground text-sm mb-4">{content.closingCta}</p>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            לכל המאמרים
          </Link>
        </section>
      </div>
    </div>
  );
}
