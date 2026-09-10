/**
 * דף הקריאה הציבורי בטארוט — באותה שפה עיצובית של דף האי-צ'ינג.
 * פאזות: intro → drawing → result. המבנה מגיע מ-`shared/tarot` (draw/CARDS),
 * הטקסטים מה-DB (`trpc.tarot.getContent`). השאלה חיה ב-state; היא תישלח לשרת
 * רק לפירוש ה-AI בלחיצה מפורשת (צעד 11) — ואינה נשמרת בשרת.
 */
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { CARD_BACK_IMAGE, DECK_ASSETS_VERSION, draw, type TarotReading as Reading } from "@shared/tarot";
import {
  buildAiContext,
  resolvePanel,
  toCardViews,
  type TarotContent,
} from "@/pages/tarot/model";
import { runDeal, SPREAD } from "@/pages/tarot/reveal";
import { CardBack, CardFace, TarotCard } from "@/components/tarot/TarotCard";
import { TarotAiPanel } from "@/components/tarot/TarotAiPanel";
import { useAuth } from "@/_core/hooks/useAuth";

type Phase = "intro" | "drawing" | "result";

// ── סגנונות (השפה של דף האי-צ'ינג) ──
const SERIF = "'Frank Ruhl Libre',serif";
const SANS = "'Heebo',sans-serif";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function TarotReading() {
  const { data, isLoading } = trpc.tarot.getContent.useQuery();
  useDocumentTitle("קריאה בקלפי טארוט — רוּחַ");

  const [phase, setPhase] = useState<Phase>("intro");
  const [question, setQuestion] = useState(""); // נשלח רק לפירוש AI, בלחיצה מפורשת
  const [qSaved, setQSaved] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // מצב אנימציית השליפה: כמה קלפים נפרסו / נחשפו
  const [dealtCount, setDealtCount] = useState(0);
  const [flippedCount, setFlippedCount] = useState(0);

  const cancelDeal = useRef<() => void>(() => {});
  useEffect(() => () => cancelDeal.current(), []);

  function onDraw() {
    cancelDeal.current();
    setReading(draw());
    setQSaved(question);
    setSelected(null);
    setDealtCount(0);
    setFlippedCount(0);
    setPhase("drawing");

    cancelDeal.current = runDeal(
      {
        onShuffleStart: () => {},
        onDeal: (i) => setDealtCount(i + 1),
        onFlip: (i) => setFlippedCount(i + 1),
        onDone: () => setPhase("result"),
      },
      { reducedMotion: prefersReducedMotion() },
    );
  }

  function onSkip() {
    cancelDeal.current();
    setDealtCount(SPREAD);
    setFlippedCount(SPREAD);
    setPhase("result");
  }

  function onReset() {
    cancelDeal.current();
    setPhase("intro");
    setReading(null);
    setSelected(null);
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div style={{ color: "oklch(0.50 0.03 60)" }}>טוען…</div>
      </div>
    );
  }
  const content = data as TarotContent;

  return (
    <div
      dir="rtl"
      className="tarot-root"
      style={{
        minHeight: "100vh",
        background: "oklch(0.97 0.014 85)",
        color: "oklch(0.22 0.028 55)",
        fontFamily: SANS,
        lineHeight: 1.8,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "72px 24px 96px" }}>
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

        {phase === "intro" && (
          <div style={{ animation: "fadeUp 0.6s ease both" }}>
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: "clamp(40px,7vw,60px)",
                textAlign: "center",
                margin: "40px 0 4px",
                color: "oklch(0.24 0.03 55)",
                lineHeight: 1.15,
              }}
            >
              טָארוֹט
            </h1>
            <p
              style={{
                textAlign: "center",
                fontFamily: SERIF,
                fontSize: 21,
                fontStyle: "italic",
                color: "oklch(0.50 0.06 60)",
                margin: "0 0 44px",
              }}
            >
              מַרְאָה שֶׁל סְמָלִים
            </p>

            <div
              style={{ fontSize: 18, lineHeight: 1.95, color: "oklch(0.30 0.025 55)" }}
              dangerouslySetInnerHTML={{ __html: content.intro.articleHtml }}
            />

            <div style={{ height: 1, background: "oklch(0.86 0.024 75)", margin: "48px 0" }} />

            <div
              style={{
                background: "oklch(0.99 0.008 80)",
                border: "1px solid oklch(0.86 0.024 75)",
                borderRadius: 14,
                padding: "30px 28px",
                boxShadow: "0 10px 36px oklch(0.3 0.04 55 / 0.08)",
              }}
            >
              <label
                style={{ display: "block", fontFamily: SERIF, fontWeight: 700, fontSize: 22, marginBottom: 14, color: "oklch(0.26 0.03 55)" }}
              >
                {content.intro.questionPrompt}
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="אפשר גם לשלוף בלי שאלה — קריאה כללית ליום הזה…"
                style={{
                  width: "100%",
                  minHeight: 96,
                  resize: "vertical",
                  padding: "14px 16px",
                  fontFamily: SANS,
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "oklch(0.24 0.03 55)",
                  background: "oklch(0.985 0.012 84)",
                  border: "1px solid oklch(0.86 0.024 75)",
                  borderRadius: 10,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, color: "oklch(0.54 0.03 60)", fontSize: 13.5 }}>
                <span style={{ fontSize: 13 }}>🔒</span>
                <span>{content.intro.questionHint}</span>
              </div>
              <button
                onClick={onDraw}
                style={{
                  marginTop: 24,
                  width: "100%",
                  padding: 17,
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: "0.02em",
                  color: "oklch(0.98 0.008 80)",
                  background: "linear-gradient(135deg, oklch(0.48 0.10 58), oklch(0.40 0.09 52))",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  boxShadow: "0 8px 22px oklch(0.42 0.09 55 / 0.32)",
                }}
              >
                {content.intro.buttonLabel}
              </button>
            </div>
          </div>
        )}

        {phase === "drawing" && reading && (
          <DrawingView
            reading={reading}
            content={content}
            dealtCount={dealtCount}
            flippedCount={flippedCount}
            onSkip={onSkip}
          />
        )}

        {phase === "result" && reading && (
          <ResultView
            reading={reading}
            qSaved={qSaved}
            content={content}
            selected={selected}
            setSelected={setSelected}
            onReset={onReset}
          />
        )}

        <DeckDownload />
      </div>
    </div>
  );
}

/**
 * "החפיסה שלנו — להורדה חופשית". מוצג רק כשנכסי החפיסה קיימים (בדיקת HEAD
 * על גב הקלף) — כך אין קישור שבור לפני העלאת התמונות.
 */
function DeckDownload() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(CARD_BACK_IMAGE, { method: "HEAD" })
      .then((res) => {
        if (alive && res.ok) setAvailable(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!available) return null;

  return (
    <div
      style={{
        marginTop: 64,
        textAlign: "center",
        borderTop: "1px solid oklch(0.86 0.024 75)",
        paddingTop: 40,
      }}
    >
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 24, color: "oklch(0.24 0.03 55)" }}>
        הַחֲפִיסָה שֶׁלָּנוּ — לְהוֹרָדָה חָפְשִׁית
      </div>
      <p style={{ maxWidth: 520, margin: "12px auto 20px", fontSize: 15.5, lineHeight: 1.9, color: "oklch(0.40 0.03 58)" }}>
        חפיסה מקורית שצוירה במיוחד עבור האתר בסגנון גואש, צמודה לקומפוזיציות
        הקלאסיות של ריידר־וייט — בלי צלבים ובלי עירום. מוזמנים{" "}
        <a href="/tarot/deck" style={{ color: "oklch(0.45 0.10 55)", fontWeight: 700 }}>
          לצפות בכל 78 הקלפים
        </a>
        , להוריד, להדפיס ולהשתמש באופן חופשי, עם ייחוס לאתר.
      </p>
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
    </div>
  );
}

/** פאזת השליפה: ערבוב (גבות רועדים) → פריסה → היפוך אחד-אחד. חושף בלבד — התוצאה כבר חושבה. */
function DrawingView({
  reading,
  content,
  dealtCount,
  flippedCount,
  onSkip,
}: {
  reading: Reading;
  content: TarotContent;
  dealtCount: number;
  flippedCount: number;
  onSkip: () => void;
}) {
  const views = toCardViews(reading, content);
  const shuffling = dealtCount === 0;

  return (
    <div
      style={{
        marginTop: 44,
        borderRadius: 20,
        padding: "48px 28px 40px",
        background: "radial-gradient(120% 120% at 50% 0%, oklch(0.26 0.035 58), oklch(0.16 0.025 55))",
        boxShadow: "0 24px 60px oklch(0.15 0.03 55 / 0.45)",
        animation: "softIn 0.5s ease both",
      }}
    >
      <div style={{ textAlign: "center", color: "oklch(0.80 0.06 82)", fontSize: 14, letterSpacing: "0.22em", marginBottom: 34 }}>
        {shuffling ? "מְעַרְבְּבִים אֶת הַחֲפִיסָה…" : "הַקְּלָפִים נִפְרָסִים"}
      </div>

      {shuffling ? (
        <div style={{ display: "flex", justifyContent: "center", minHeight: 220 }}>
          <div style={{ position: "relative", width: 140 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={
                  {
                    position: i === 2 ? "relative" : "absolute",
                    inset: 0,
                    "--shuffle-rot": `${(i - 1) * 4}deg`,
                    animation: `tarotShuffle 0.9s ease-in-out ${i * 0.12}s infinite`,
                  } as React.CSSProperties
                }
              >
                <CardBack />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", gap: "clamp(10px,3vw,22px)" }}>
          {views.map((v, i) => (
            <div key={v.id} style={{ width: "clamp(96px,22vw,150px)" }}>
              <TarotCard view={v} faceUp={i < flippedCount} dealt={i < dealtCount} />
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 34 }}>
        <button
          onClick={onSkip}
          style={{
            background: "transparent",
            border: "1px solid oklch(0.55 0.04 70 / 0.5)",
            color: "oklch(0.78 0.05 80)",
            padding: "9px 22px",
            borderRadius: 999,
            fontFamily: SANS,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          דלג להצגת התוצאה
        </button>
      </div>
    </div>
  );
}

function ResultView({
  reading,
  qSaved,
  content,
  selected,
  setSelected,
  onReset,
}: {
  reading: Reading;
  qSaved: string;
  content: TarotContent;
  selected: number | null;
  setSelected: (i: number | null) => void;
  onReset: () => void;
}) {
  const views = toCardViews(reading, content);
  const panel = resolvePanel(views, selected);
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ marginTop: 40 }}>
      {qSaved.trim() && (
        <div style={{ textAlign: "center", marginBottom: 36, animation: "fadeUp 0.5s ease both" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.2em", color: "oklch(0.55 0.03 60)", marginBottom: 8 }}>
            שְׁאֵלָתְךָ
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 21, color: "oklch(0.34 0.04 55)" }}>
            {qSaved}
          </div>
        </div>
      )}

      {/* ── שלושת הקלפים, מימין (הראשון) לשמאל ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "clamp(12px,3.5vw,28px)",
          flexWrap: "wrap",
          animation: "fadeUp 0.6s ease both",
        }}
      >
        {views.map((v, i) => (
          <div key={v.id} style={{ textAlign: "center", width: "clamp(120px,26vw,190px)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.24em", color: "oklch(0.55 0.03 60)", marginBottom: 12 }}>
              {`קְלָף ${["רִאשׁוֹן", "שֵׁנִי", "שְׁלִישִׁי"][i]}`}
            </div>
            <TarotCard view={v} faceUp selected={selected === i} onClick={() => setSelected(i)} />
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 19, color: "oklch(0.24 0.03 55)", marginTop: 12 }}>
              {v.name}
            </div>
            <div style={{ fontSize: 12.5, color: "oklch(0.52 0.03 60)", marginTop: 2 }}>{v.suitLabel}</div>
          </div>
        ))}
      </div>

      {/* ── פירוש AI לפריסה — תמיד מעל פירושי הקלפים, לעולם לא מחביא אותם ── */}
      {content.intro.aiEnabled && (
        <TarotAiPanel
          question={qSaved}
          cards={buildAiContext(views)}
          isAuthenticated={isAuthenticated}
          monthlyLimit={content.aiMonthlyLimit}
        />
      )}

      <div style={{ textAlign: "center", marginTop: 32, fontSize: 13.5, color: "oklch(0.55 0.03 60)" }}>
        בחרו קלף כדי לקרוא את פירושו בחלון שלמטה
      </div>

      {/* ── חלון הפירוט היחיד ── */}
      {panel && (
        <div
          style={{
            marginTop: 16,
            background: "oklch(0.99 0.008 80)",
            border: "1px solid oklch(0.86 0.024 75)",
            borderRadius: 14,
            padding: "34px 32px",
            boxShadow: "0 10px 36px oklch(0.3 0.04 55 / 0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
            <div style={{ width: 64, flexShrink: 0 }}>
              <CardFace view={panel} />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "oklch(0.58 0.06 66)", marginBottom: 5 }}>
                פֵּרוּשׁ הַקְּלָף
              </div>
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 25, color: "oklch(0.24 0.03 55)" }}>
                {panel.name}
              </div>
              <div style={{ fontSize: 14, color: "oklch(0.52 0.03 60)", marginTop: 2 }}>
                {panel.suitLabel}
                {panel.summary ? ` · ${panel.summary}` : ""}
              </div>
            </div>
          </div>
          <div style={{ height: 2, width: 54, background: "oklch(0.74 0.13 78)", marginBottom: 22 }} />

          {panel.interpretationHtml ? (
            <>
              <div
                className="iching-interpretation"
                style={{ fontSize: 17.5, lineHeight: 1.95, color: "oklch(0.30 0.025 55)" }}
                dangerouslySetInnerHTML={{ __html: panel.interpretationHtml }}
              />
              <div style={{ marginTop: 12, fontSize: 12.5, color: "oklch(0.55 0.03 60)" }}>נכתב על ידי עורך האתר</div>
            </>
          ) : panel.summary ? (
            <p style={{ fontSize: 17, color: "oklch(0.34 0.03 55)", margin: 0 }}>{panel.summary}</p>
          ) : (
            <p style={{ fontSize: 16, fontStyle: "italic", color: "oklch(0.52 0.04 58)", margin: 0 }}>
              הפירוש המלא בכתיבה.
            </p>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <button
          onClick={onReset}
          style={{
            padding: "14px 38px",
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 18,
            color: "oklch(0.42 0.09 55)",
            background: "transparent",
            border: "1.5px solid oklch(0.62 0.08 60)",
            borderRadius: 999,
            cursor: "pointer",
          }}
        >
          שְׁלִיפָה חֲדָשָׁה
        </button>
      </div>
    </div>
  );
}
