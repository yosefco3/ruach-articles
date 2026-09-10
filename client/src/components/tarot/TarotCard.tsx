/**
 * קלף טארוט עם היפוך תלת-ממדי (rotateY): גב ↔ פנים, backface-visibility.
 * גם הגב וגם הפנים סובלים היעדר נכסים בחן — placeholder מעוצב דרך onError.
 */
import { useState } from "react";
import { CARD_BACK_IMAGE } from "@shared/tarot";
import { cardFallbackGlyph, type CardView } from "@/pages/tarot/model";

const SERIF = "'Frank Ruhl Libre',serif";

/** פני הקלף: התמונה, או placeholder (שם + גליף) כשהנכס עוד לא הועלה. */
export function CardFace({ view }: { view: CardView }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "600 / 1030",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "radial-gradient(120% 120% at 50% 0%, oklch(0.30 0.045 58), oklch(0.18 0.03 55))",
          color: "oklch(0.85 0.09 82)",
          border: "1px solid oklch(0.45 0.06 65)",
        }}
      >
        <div style={{ fontSize: 34, lineHeight: 1 }}>{cardFallbackGlyph(view.id)}</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 17, padding: "0 8px", textAlign: "center" }}>
          {view.name}
        </div>
      </div>
    );
  }
  return (
    <img
      src={view.imageUrl}
      alt={`קלף ${view.name} (${view.en}) — חפיסת הטארוט של רוח חכמה`}
      onError={() => setFailed(true)}
      style={{ width: "100%", aspectRatio: "600 / 1030", objectFit: "cover", borderRadius: 10, display: "block" }}
    />
  );
}

/** גב הקלף: התמונה מהחפיסה, או דוגמת כוכבים ב-CSS כשאין נכס. */
export function CardBack() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        aria-hidden
        style={{
          width: "100%",
          aspectRatio: "600 / 1030",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, oklch(0.35 0.06 58 / 0.6) 0 6%, transparent 7%)," +
            "radial-gradient(circle at 70% 60%, oklch(0.35 0.06 58 / 0.6) 0 5%, transparent 6%)," +
            "radial-gradient(120% 120% at 50% 0%, oklch(0.26 0.035 58), oklch(0.16 0.025 55))",
          color: "oklch(0.72 0.10 80)",
          border: "1px solid oklch(0.45 0.06 65)",
        }}
      >
        <div style={{ fontSize: 30, fontFamily: "serif" }}>✶</div>
      </div>
    );
  }
  return (
    <img
      src={CARD_BACK_IMAGE}
      alt=""
      aria-hidden
      onError={() => setFailed(true)}
      style={{ width: "100%", aspectRatio: "600 / 1030", objectFit: "cover", borderRadius: 10, display: "block" }}
    />
  );
}

export function TarotCard({
  view,
  faceUp,
  dealt = true,
  selected = false,
  onClick,
}: {
  view: CardView;
  faceUp: boolean;
  /** false לפני שהקלף "נפרס" — שקוף ומוזז מעט למעלה. */
  dealt?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      aria-label={faceUp ? view.name : "קלף מכוסה"}
      onClick={onClick}
      style={{
        perspective: 900,
        width: "100%",
        cursor: onClick ? "pointer" : "default",
        opacity: dealt ? 1 : 0,
        transform: dealt ? "translateY(0)" : "translateY(-14px)",
        transition: "opacity .35s ease, transform .35s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "600 / 1030",
          transformStyle: "preserve-3d",
          transition: "transform .7s cubic-bezier(.2,.7,.25,1)",
          transform: faceUp ? "rotateY(0deg)" : "rotateY(180deg)",
          borderRadius: 12,
          boxShadow: selected
            ? "0 0 0 4px oklch(0.74 0.13 78 / 0.35), 0 10px 26px oklch(0.3 0.04 55 / 0.22)"
            : "0 8px 20px oklch(0.3 0.04 55 / 0.16)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
          <CardFace view={view} />
        </div>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <CardBack />
        </div>
      </div>
    </div>
  );
}
