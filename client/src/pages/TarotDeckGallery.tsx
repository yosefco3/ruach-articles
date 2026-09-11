/**
 * דף הגלריה של החפיסה המלאה — /tarot/deck.
 * מציג את כל 78 הקלפים בקבוצות: ארקנה גדולה ואז ארבע הסדרות (מטות·אש,
 * גביעים·מים, חרבות·אוויר, מטבעות·אדמה). כל אריח הוא קישור לדף הקלף
 * (/tarot/card/<slug>). סטטי לחלוטין — המבנה והשמות
 * מ-`shared/tarot` (deckSections), התמונות מ-/tarot-cards/<id>.webp.
 */
import { Link } from "wouter";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DECK_ASSETS_VERSION, cardImagePath, cardSlug, type CardStruct } from "@shared/tarot";
import { cardAltText, deckSections } from "@/pages/tarot/model";

const SERIF = "'Frank Ruhl Libre',serif";
const SANS = "'Heebo',sans-serif";

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

function CardTile({ card }: { card: CardStruct }) {
  return (
    <Link
      href={`/tarot/card/${cardSlug(card)}`}
      style={{ display: "block", textAlign: "center", textDecoration: "none", color: "inherit" }}
    >
      <figure style={{ margin: 0 }}>
        <img
          src={cardImagePath(card.id)}
          alt={cardAltText(card)}
          loading="lazy"
          style={{
            width: "100%",
            height: "auto",
            borderRadius: 10,
            border: "1px solid oklch(0.86 0.024 75)",
            boxShadow: "0 6px 18px oklch(0.3 0.04 55 / 0.10)",
            background: "oklch(0.93 0.014 80)",
          }}
        />
        <figcaption style={{ marginTop: 8, lineHeight: 1.4 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 15.5,
              color: "oklch(0.26 0.03 55)",
            }}
          >
            {card.arcana === "major" && typeof card.number === "number"
              ? `${ROMAN[card.number]} · ${card.he}`
              : card.he}
          </div>
          <div style={{ fontSize: 12, color: "oklch(0.52 0.03 60)" }}>{card.en}</div>
        </figcaption>
      </figure>
    </Link>
  );
}

export default function TarotDeckGallery() {
  useDocumentTitle("החפיסה המלאה — 78 קלפי הטארוט של רוח חכמה");
  const sections = deckSections();

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
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "72px 24px 96px" }}>
        {/* ── כותרת אתר ── */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 30, letterSpacing: "0.04em", color: "oklch(0.42 0.09 55)" }}>
            רוּחַ
          </div>
          <div style={{ fontSize: 13, letterSpacing: "0.28em", color: "oklch(0.50 0.03 60)", marginTop: 4 }}>
            רוחניות · פילוסופיה · ריפוי
          </div>
          <div
            style={{
              height: 2,
              width: 120,
              margin: "22px auto 0",
              background: "linear-gradient(to left, transparent, oklch(0.74 0.13 78), transparent)",
            }}
          />
        </div>

        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(34px,6vw,52px)",
            textAlign: "center",
            margin: "40px 0 4px",
            color: "oklch(0.24 0.03 55)",
            lineHeight: 1.15,
          }}
        >
          הַחֲפִיסָה הַמְּלֵאָה
        </h1>
        <p
          style={{
            textAlign: "center",
            fontFamily: SERIF,
            fontSize: 20,
            fontStyle: "italic",
            color: "oklch(0.50 0.06 60)",
            margin: "0 0 16px",
          }}
        >
          78 קלפים שצוירו במיוחד עבור האתר, בסגנון גואש
        </p>
        <p
          style={{
            textAlign: "center",
            maxWidth: 560,
            margin: "0 auto 24px",
            fontSize: 15.5,
            color: "oklch(0.40 0.03 58)",
          }}
        >
          חפיסה מקורית הצמודה לקומפוזיציות הקלאסיות של ריידר־וייט — בלי צלבים ובלי עירום.
          מוזמנים <Link href="/tarot" style={{ color: "oklch(0.45 0.10 55)", fontWeight: 600 }}>לשלוף קריאה</Link> או
          להוריד את החפיסה כולה בתחתית העמוד.
        </p>

        {sections.map((section) => (
          <section key={section.key}>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 26,
                margin: "56px 0 6px",
                color: "oklch(0.28 0.05 55)",
                textAlign: "center",
              }}
            >
              {section.title}
            </h2>
            <div
              style={{
                height: 1,
                width: 180,
                margin: "0 auto 26px",
                background: "linear-gradient(to left, transparent, oklch(0.80 0.06 70), transparent)",
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "22px 16px",
              }}
            >
              {section.cards.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </div>
          </section>
        ))}

        {/* ── הורדה + חזרה ── */}
        <div
          style={{
            marginTop: 72,
            textAlign: "center",
            borderTop: "1px solid oklch(0.86 0.024 75)",
            paddingTop: 40,
          }}
        >
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={`/tarot-cards/ruach-tarot-deck.zip?v=${DECK_ASSETS_VERSION}`}
              download
              style={{
                display: "inline-block",
                padding: "13px 34px",
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 18,
                color: "oklch(0.98 0.008 80)",
                background: "linear-gradient(135deg, oklch(0.48 0.10 58), oklch(0.40 0.09 52))",
                borderRadius: 10,
                textDecoration: "none",
                boxShadow: "0 8px 22px oklch(0.42 0.09 55 / 0.32)",
              }}
            >
              הורדת החפיסה (ZIP)
            </a>
            <a
              href={`/tarot-cards/ruach-tarot-deck-en.zip?v=${DECK_ASSETS_VERSION}`}
              download
              style={{
                display: "inline-block",
                padding: "13px 30px",
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 17,
                color: "oklch(0.40 0.09 52)",
                background: "oklch(0.99 0.008 80)",
                border: "1.5px solid oklch(0.55 0.08 55)",
                borderRadius: 10,
                textDecoration: "none",
              }}
            >
              English deck (ZIP)
            </a>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/tarot" style={{ color: "oklch(0.45 0.10 55)", fontSize: 15.5, fontWeight: 600 }}>
              → לקריאה בקלפים
            </Link>
            <Link href="/tarot/guide" style={{ color: "oklch(0.45 0.10 55)", fontSize: 15.5, fontWeight: 600 }}>
              → המדריך לקלפי הטארוט
            </Link>
          </div>
          <p style={{ maxWidth: 540, margin: "18px auto 0", fontSize: 14, lineHeight: 1.8, color: "oklch(0.45 0.03 58)" }}>
            השימוש בחפיסה חופשי — להורדה, להדפסה, לשיתוף וליצירה — בתנאי אחד:
            בכל פרסום או שימוש פומבי יש לציין את <strong>רוח חכמה</strong> כמקור ולצרף
            קישור פעיל אל <a href="https://ruachwisdom.org/tarot" style={{ color: "oklch(0.45 0.10 55)", fontWeight: 600 }}>ruachwisdom.org/tarot</a>.
          </p>
          <p style={{ marginTop: 14, fontSize: 13.5, color: "oklch(0.55 0.03 60)" }}>
            התמונות צוירו על ידי המודלים Claude Fable 5 (עיצוב הסצנות והבימוי) ו־Z-Image Turbo (הציור).
          </p>
        </div>
      </div>
    </div>
  );
}
