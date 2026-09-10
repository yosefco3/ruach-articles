/**
 * דף קלף בודד — /tarot/card/<slug> (78 דפי נחיתה ל-SEO).
 * התוכן מ-tarot.getContent (אותו query של דף הקריאה — SSR prefetch קיים),
 * המיזוג ב-cardPageView. קלף לא מוכר → NotFound.
 */
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cardPageView } from "@/pages/tarot/model";
import NotFound from "@/pages/NotFound";

const SERIF = "'Frank Ruhl Libre',serif";
const SANS = "'Heebo',sans-serif";

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

const LINK_STYLE = { color: "oklch(0.45 0.10 55)", fontWeight: 600 } as const;

export default function TarotCardPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: content } = trpc.tarot.getContent.useQuery();

  const page = content ? cardPageView(content, slug) : null;
  useDocumentTitle(
    page ? `${page.view.name} — פירוש הקלף בטארוט | רוח חכמה` : "טארוט — רוח חכמה",
  );

  if (!content) return null; // SSR prefetch ממלא; ברענון-לקוח רגע של ריק
  if (!page) return <NotFound />;

  const { view, struct, prev, next, alt } = page;
  const numberLine =
    struct.arcana === "major" && typeof struct.number === "number"
      ? `${ROMAN[struct.number]} · ${view.suitLabel}`
      : view.suitLabel;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "oklch(0.97 0.014 85)",
        color: "oklch(0.22 0.028 55)",
        fontFamily: SANS,
        lineHeight: 1.8,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 96px" }}>
        {/* ── ניווט עליון (breadcrumb) ── */}
        <nav aria-label="ניווט" style={{ fontSize: 14, color: "oklch(0.50 0.03 60)" }}>
          <Link href="/" style={LINK_STYLE}>רוח חכמה</Link>
          {" › "}
          <Link href="/tarot" style={LINK_STYLE}>טארוט</Link>
          {" › "}
          <span>{view.name}</span>
        </nav>

        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(34px,6vw,50px)",
            textAlign: "center",
            margin: "34px 0 2px",
            color: "oklch(0.24 0.03 55)",
            lineHeight: 1.15,
          }}
        >
          {view.name}
        </h1>
        <p
          style={{
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 19,
            fontStyle: "italic",
            color: "oklch(0.50 0.06 60)",
            margin: "0 0 6px",
          }}
        >
          {view.en} · {numberLine}
        </p>

        {view.summary && (
          <p
            style={{
              textAlign: "center",
              maxWidth: 520,
              margin: "0 auto 28px",
              fontSize: 17,
              fontWeight: 600,
              color: "oklch(0.36 0.05 55)",
            }}
          >
            {view.summary}
          </p>
        )}

        <figure style={{ margin: "0 auto 36px", maxWidth: 320, textAlign: "center" }}>
          <img
            src={view.imageUrl}
            alt={alt}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 14,
              border: "1px solid oklch(0.86 0.024 75)",
              boxShadow: "0 14px 40px oklch(0.3 0.04 55 / 0.14)",
              background: "oklch(0.93 0.014 80)",
            }}
          />
        </figure>

        {/* ── הפירוש המלא ── */}
        <section
          style={{ fontSize: 17.5, lineHeight: 1.95, color: "oklch(0.28 0.025 55)" }}
          dangerouslySetInnerHTML={{ __html: view.interpretationHtml }}
        />

        {/* ── שכנים בחפיסה ── */}
        <nav
          aria-label="קלפים סמוכים"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            margin: "44px 0 0",
            paddingTop: 24,
            borderTop: "1px solid oklch(0.86 0.024 75)",
            fontSize: 15,
          }}
        >
          <Link href={`/tarot/card/${prev.slug}`} style={LINK_STYLE}>
            → {prev.name}
          </Link>
          <Link href="/tarot/deck" style={{ ...LINK_STYLE, fontWeight: 500 }}>
            כל 78 הקלפים
          </Link>
          <Link href={`/tarot/card/${next.slug}`} style={LINK_STYLE}>
            {next.name} ←
          </Link>
        </nav>

        {/* ── CTA לשליפה ── */}
        <div
          style={{
            marginTop: 40,
            textAlign: "center",
            background: "oklch(0.99 0.008 80)",
            border: "1px solid oklch(0.86 0.024 75)",
            borderRadius: 14,
            padding: "26px 24px",
            boxShadow: "0 10px 36px oklch(0.3 0.04 55 / 0.08)",
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
            רוצים לראות אילו קלפים ייצאו לכם?
          </div>
          <p style={{ fontSize: 15, color: "oklch(0.42 0.03 58)", margin: "0 0 16px" }}>
            שליפת שלושה קלפים מהחפיסה המקורית של האתר — חינם, והשאלה אינה נשמרת.
          </p>
          <Link
            href="/tarot"
            style={{
              display: "inline-block",
              padding: "12px 32px",
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 17,
              color: "oklch(0.98 0.008 80)",
              background: "linear-gradient(135deg, oklch(0.48 0.10 58), oklch(0.40 0.09 52))",
              borderRadius: 10,
              textDecoration: "none",
              boxShadow: "0 8px 22px oklch(0.42 0.09 55 / 0.32)",
            }}
          >
            לשליפת קלפים
          </Link>
        </div>
      </div>
    </div>
  );
}
