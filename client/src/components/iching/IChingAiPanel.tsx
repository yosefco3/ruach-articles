/**
 * תיבת "פֵּרוּשׁ AI מותאם אישית" — מוצגת מעל חלון הפירוש הסטטי בדף הקריאה.
 * השאלה נשלחת לשרת אך ורק בלחיצה מפורשת על הכפתור, ולעולם אינה נשמרת ב-DB.
 */
import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import type { AiContext } from "@/pages/iching/model";

const LOADING_LINES = [
  "ה-AI מנתח את ההקסגרמות…",
  "קורא את המעבר בין הקווים…",
  "מחבר את הפירוש לשאלתך…",
];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const cardStyle: React.CSSProperties = {
  marginTop: 16,
  background: "oklch(0.99 0.008 80)",
  border: "1px solid oklch(0.86 0.024 75)",
  borderRadius: 14,
  padding: "30px 32px",
  boxShadow: "0 10px 36px oklch(0.3 0.04 55 / 0.07)",
};

function PanelHeader() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>✨</span>
        <div
          style={{
            fontFamily: "'Frank Ruhl Libre',serif",
            fontWeight: 900,
            fontSize: 23,
            color: "oklch(0.24 0.03 55)",
          }}
        >
          פֵּרוּשׁ AI מותאם אישית
        </div>
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "oklch(0.46 0.09 58)",
            background: "oklch(0.95 0.03 82)",
            border: "1px solid oklch(0.80 0.06 78)",
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          נוצר על ידי בינה מלאכותית
        </span>
      </div>
      <div style={{ height: 2, width: 54, background: "oklch(0.74 0.13 78)", margin: "14px 0 20px" }} />
    </>
  );
}

export function IChingAiPanel({
  question,
  context,
  isAuthenticated,
}: {
  question: string;
  context: AiContext;
  isAuthenticated: boolean;
}) {
  const mutation = trpc.iching.interpret.useMutation();
  const [loadingLine, setLoadingLine] = useState(0);

  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  useEffect(() => {
    if (!mutation.isPending || reduced.current) return;
    const id = setInterval(() => {
      setLoadingLine((i) => (i + 1) % LOADING_LINES.length);
    }, 1800);
    return () => clearInterval(id);
  }, [mutation.isPending]);

  // ── אורח: חסום עם הזמנה להתחברות ──
  if (!isAuthenticated) {
    return (
      <div dir="rtl" style={cardStyle}>
        <PanelHeader />
        <p style={{ margin: "0 0 18px", fontSize: 16.5, lineHeight: 1.85, color: "oklch(0.34 0.03 55)" }}>
          לקבלת פירוש AI מותאם לשאלתך, אנא התחבר עם חשבון גוגל (מוגבל ל-5 קריאות חינם בחודש).
        </p>
        <a
          href={getLoginUrl()}
          style={{
            display: "inline-block",
            padding: "12px 30px",
            fontFamily: "'Frank Ruhl Libre',serif",
            fontWeight: 700,
            fontSize: 17,
            color: "oklch(0.98 0.008 80)",
            background: "linear-gradient(135deg, oklch(0.48 0.10 58), oklch(0.40 0.09 52))",
            border: "none",
            borderRadius: 10,
            textDecoration: "none",
            boxShadow: "0 8px 22px oklch(0.42 0.09 55 / 0.32)",
          }}
        >
          התחבר עם גוגל
        </a>
      </div>
    );
  }

  const isQuotaError =
    mutation.error?.data?.code === "FORBIDDEN" ||
    mutation.error?.message === "QUOTA_EXCEEDED";

  return (
    <div dir="rtl" style={cardStyle}>
      <PanelHeader />

      {mutation.data ? (
        <>
          <div
            className="iching-interpretation"
            style={{ fontSize: 17.5, lineHeight: 1.95, color: "oklch(0.30 0.025 55)" }}
            dangerouslySetInnerHTML={{ __html: marked.parse(mutation.data.interpretation) as string }}
          />
          {mutation.data.usage && (
            <div style={{ marginTop: 16, fontSize: 12.5, color: "oklch(0.55 0.03 60)" }}>
              נותרו {mutation.data.usage.remaining} קריאות החודש
            </div>
          )}
        </>
      ) : mutation.isPending ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
          <span
            aria-hidden
            style={{
              width: 18,
              height: 18,
              border: "2px solid oklch(0.80 0.06 78)",
              borderTopColor: "oklch(0.46 0.09 58)",
              borderRadius: "50%",
              animation: reduced.current ? "none" : "ichingSpin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 16, fontStyle: "italic", color: "oklch(0.46 0.05 58)" }}>
            {LOADING_LINES[loadingLine]}
          </span>
        </div>
      ) : isQuotaError ? (
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.85, color: "oklch(0.42 0.08 45)" }}>
          ניצלת את 5 הקריאות החינמיות שלך לחודש זה. תוכל להמשיך ליהנות מהפירושים הסטטיים באתר.
        </p>
      ) : mutation.error ? (
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.85, color: "oklch(0.42 0.08 45)" }}>
          אירעה שגיאה בקבלת הפירוש. נסה שוב בעוד רגע.
        </p>
      ) : (
        <button
          onClick={() => mutation.mutate({ question, ...context })}
          style={{
            padding: "13px 30px",
            fontFamily: "'Frank Ruhl Libre',serif",
            fontWeight: 700,
            fontSize: 18,
            color: "oklch(0.98 0.008 80)",
            background: "linear-gradient(135deg, oklch(0.48 0.10 58), oklch(0.40 0.09 52))",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            boxShadow: "0 8px 22px oklch(0.42 0.09 55 / 0.32)",
          }}
        >
          קבל פירוש AI מותאם אישית
        </button>
      )}
    </div>
  );
}
