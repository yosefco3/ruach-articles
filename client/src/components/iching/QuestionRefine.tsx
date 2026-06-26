/**
 * כרטיס בחירת ניסוח שמופיע לפני ההטלה כשה-AI מזהה שהשאלה אינה מתאימה לאי צ'ינג.
 * מציג עד שני ניסוחים חלופיים + הניסוח המקורי; לחיצה על שורה בוחרת ומתקדמת מיד להטלה.
 * רכיב תצוגה בלבד — אין רשת, רק callbacks.
 */

interface Props {
  original: string;
  suggestions: string[];
  onPick: (chosen: string) => void;
}

const ROW_BASE: React.CSSProperties = {
  width: "100%",
  textAlign: "right",
  padding: "16px 18px",
  borderRadius: 12,
  cursor: "pointer",
  fontFamily: "'Heebo',sans-serif",
  fontSize: 17,
  lineHeight: 1.7,
  display: "block",
  transition: "border-color 0.15s, background 0.15s",
};

const BADGE_LETTERS = ["א׳", "ב׳"];

export function QuestionRefine({ original, suggestions, onPick }: Props) {
  const picks = suggestions.slice(0, 2);
  return (
    <div
      dir="rtl"
      style={{
        marginTop: 22,
        background: "oklch(0.99 0.008 80)",
        border: "1px solid oklch(0.86 0.024 75)",
        borderRadius: 14,
        padding: "26px 24px",
        boxShadow: "0 10px 36px oklch(0.3 0.04 55 / 0.08)",
        animation: "fadeUp 0.4s ease both",
      }}
    >
      <div
        style={{
          fontFamily: "'Frank Ruhl Libre',serif",
          fontWeight: 700,
          fontSize: 21,
          color: "oklch(0.26 0.03 55)",
          marginBottom: 6,
        }}
      >
        אולי ננסח את השאלה כך?
      </div>
      <p style={{ fontSize: 14.5, color: "oklch(0.50 0.03 60)", margin: "0 0 18px" }}>
        האי צ'ינג מאיר תהליכים. בחרו ניסוח, או המשיכו עם השאלה שלכם — לחיצה אחת והמטבעות מוטלים.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {picks.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(s)}
            style={{
              ...ROW_BASE,
              color: "oklch(0.24 0.03 55)",
              background: "oklch(0.985 0.012 84)",
              border: "1.5px solid oklch(0.74 0.13 78)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 12.5,
                fontWeight: 700,
                color: "oklch(0.46 0.10 58)",
                marginBottom: 6,
              }}
            >
              {picks.length > 1 ? `ניסוח מוצע ${BADGE_LETTERS[i]}` : "ניסוח מוצע"}
            </span>
            <span style={{ display: "block" }}>{s}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPick(original)}
          style={{
            ...ROW_BASE,
            color: "oklch(0.42 0.03 60)",
            background: "oklch(0.985 0.008 84)",
            border: "1px solid oklch(0.86 0.024 75)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              fontSize: 12.5,
              fontWeight: 700,
              color: "oklch(0.54 0.03 60)",
              marginBottom: 6,
            }}
          >
            הניסוח שלי
          </span>
          <span style={{ display: "block" }}>{original}</span>
        </button>
      </div>
    </div>
  );
}
