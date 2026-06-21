/**
 * דף הקריאה הציבורי באי-צ'ינג — פורט מהאב-טיפוס (`קריאת-אי-צינג-עצמאי.html`).
 * שלוש פאזות: intro → casting → result. המבנה מגיע מ-`shared/iching` (cast/TRIGRAMS),
 * הטקסטים מה-DB (`trpc.iching.getContent`). השאלה חיה רק ב-state ולעולם אינה נשלחת לשרת.
 */
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  cast,
  TRIGRAMS,
  SUM_NAMES,
  type Reading,
  type CoinFace,
  type LineSum,
} from "@shared/iching";
import { Hexagram } from "@/components/iching/Hexagram";
import { Coins } from "@/components/iching/Coins";
import {
  DEFAULT_SEL,
  resolvePanel,
  changingLabel,
  type Sel,
  type IChingContent,
} from "@/pages/iching/model";

type Phase = "intro" | "casting" | "result";

const FLIP_MS = 750;
const BETWEEN_MS = 1250;

// ── סגנונות נבחרים (פורט מהאב-טיפוס) ──
function hexBoxStyle(selected: boolean): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "20px 28px",
    borderRadius: 16,
    cursor: "pointer",
    transition: "all .15s",
    background: selected ? "oklch(0.95 0.03 82)" : "transparent",
    border: selected ? "1.5px solid oklch(0.60 0.10 65)" : "1.5px solid oklch(0.88 0.022 75 / 0.6)",
    boxShadow: selected ? "0 0 0 4px oklch(0.74 0.13 78 / 0.18)" : "none",
  };
}
function triChipStyle(selected: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 14px",
    borderRadius: 999,
    cursor: "pointer",
    transition: "all .15s",
    fontFamily: "'Frank Ruhl Libre',serif",
    color: selected ? "oklch(0.98 0.008 80)" : "oklch(0.40 0.05 58)",
    background: selected ? "oklch(0.46 0.09 58)" : "oklch(0.96 0.018 82)",
    border: selected ? "1px solid oklch(0.46 0.09 58)" : "1px solid oklch(0.86 0.024 75)",
  };
}

function TrigramChips({
  values,
  selTri,
  onSelect,
}: {
  values: number[];
  selTri: number | null;
  onSelect: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
      {values.map((v) => {
        const t = TRIGRAMS[v];
        return (
          <div key={v} onClick={() => onSelect(v)} style={triChipStyle(selTri === v)}>
            <span style={{ fontSize: 21, lineHeight: 1, fontFamily: "serif" }}>{t.symbol}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function IChingReading() {
  const { data, isLoading } = trpc.iching.getContent.useQuery();

  const [phase, setPhase] = useState<Phase>("intro");
  const [question, setQuestion] = useState(""); // לעולם לא נשלח לשרת
  const [qSaved, setQSaved] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [revealCount, setRevealCount] = useState(0);
  const [throwIndex, setThrowIndex] = useState(0);
  const [throwSum, setThrowSum] = useState<LineSum | null>(null);
  const [coins, setCoins] = useState<{ faces: CoinFace[] | null; flipping: boolean }>({
    faces: null,
    flipping: false,
  });
  const [sel, setSel] = useState<Sel>(DEFAULT_SEL);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  function runThrow(i: number, r: Reading) {
    if (i >= 6) {
      setPhase("result");
      return;
    }
    setThrowIndex(i);
    setThrowSum(null);
    setCoins({ faces: null, flipping: true });
    timers.current.push(
      setTimeout(() => {
        const toss = r.tosses[i];
        setCoins({ faces: toss.coins, flipping: false });
        setRevealCount(i + 1);
        setThrowSum(toss.sum);
        timers.current.push(setTimeout(() => runThrow(i + 1, r), BETWEEN_MS));
      }, FLIP_MS),
    );
  }

  function onCast() {
    clearTimers();
    const r = cast();
    setReading(r);
    setQSaved(question);
    setSel(DEFAULT_SEL);
    setRevealCount(0);
    setCoins({ faces: null, flipping: false });
    setPhase("casting");
    runThrow(0, r);
  }

  function onSkip() {
    clearTimers();
    if (reading) {
      setRevealCount(6);
      setPhase("result");
    }
  }

  function onReset() {
    clearTimers();
    setPhase("intro");
    setReading(null);
    setRevealCount(0);
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div style={{ color: "oklch(0.50 0.03 60)" }}>טוען…</div>
      </div>
    );
  }
  const content = data as IChingContent;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "oklch(0.97 0.014 85)",
        color: "oklch(0.22 0.028 55)",
        fontFamily: "'Heebo',sans-serif",
        lineHeight: 1.8,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "72px 24px 96px" }}>
        {/* ── כותרת אתר ── */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            style={{
              fontFamily: "'Frank Ruhl Libre',serif",
              fontWeight: 900,
              fontSize: 30,
              letterSpacing: "0.04em",
              color: "oklch(0.42 0.09 55)",
            }}
          >
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
                fontFamily: "'Frank Ruhl Libre',serif",
                fontWeight: 900,
                fontSize: "clamp(40px,7vw,60px)",
                textAlign: "center",
                margin: "40px 0 4px",
                color: "oklch(0.24 0.03 55)",
                lineHeight: 1.15,
              }}
            >
              אִי צִ׳ינְג
            </h1>
            <p
              style={{
                textAlign: "center",
                fontFamily: "'Frank Ruhl Libre',serif",
                fontSize: 21,
                fontStyle: "italic",
                color: "oklch(0.50 0.06 60)",
                margin: "0 0 44px",
              }}
            >
              סֵפֶר הַתְּמוּרוֹת
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
                style={{
                  display: "block",
                  fontFamily: "'Frank Ruhl Libre',serif",
                  fontWeight: 700,
                  fontSize: 22,
                  marginBottom: 14,
                  color: "oklch(0.26 0.03 55)",
                }}
              >
                {content.intro.questionPrompt}
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="כתוב כאן את שאלתך, והַחזק אותה במחשבתך בזמן ההטלה…"
                style={{
                  width: "100%",
                  minHeight: 96,
                  resize: "vertical",
                  padding: "14px 16px",
                  fontFamily: "'Heebo',sans-serif",
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "oklch(0.24 0.03 55)",
                  background: "oklch(0.985 0.012 84)",
                  border: "1px solid oklch(0.86 0.024 75)",
                  borderRadius: 10,
                  outline: "none",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 10,
                  color: "oklch(0.54 0.03 60)",
                  fontSize: 13.5,
                }}
              >
                <span style={{ fontSize: 13 }}>🔒</span>
                <span>{content.intro.questionHint}</span>
              </div>
              <button
                onClick={onCast}
                style={{
                  marginTop: 24,
                  width: "100%",
                  padding: 17,
                  fontFamily: "'Frank Ruhl Libre',serif",
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

        {phase === "casting" && reading && (
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
            <div
              style={{
                textAlign: "center",
                color: "oklch(0.80 0.06 82)",
                fontSize: 14,
                letterSpacing: "0.22em",
                marginBottom: 34,
              }}
            >
              {`הַשְׁלָכָה ${throwIndex + 1} מִתּוֹךְ 6`}
            </div>
            <div style={{ minHeight: 96, display: "flex", alignItems: "center", justifyContent: "center", perspective: 600 }}>
              <Coins faces={coins.faces} flipping={coins.flipping} />
            </div>
            <div
              style={{
                textAlign: "center",
                minHeight: 30,
                marginTop: 18,
                color: "oklch(0.82 0.11 82)",
                fontFamily: "'Frank Ruhl Libre',serif",
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              {throwSum ? `${throwSum} — ${SUM_NAMES[throwSum]}` : ""}
            </div>
            <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
              <Hexagram
                lines={reading.lines.slice(0, revealCount)}
                slots={6}
                mid
                color="oklch(0.82 0.12 82)"
                mark="#fff0c0"
                placeholder="oklch(0.70 0.05 80 / 0.45)"
                shadow="0 0 14px oklch(0.80 0.12 82 / 0.5)"
                animateNewest
              />
            </div>
            <div style={{ textAlign: "center", marginTop: 34 }}>
              <button
                onClick={onSkip}
                style={{
                  background: "transparent",
                  border: "1px solid oklch(0.55 0.04 70 / 0.5)",
                  color: "oklch(0.78 0.05 80)",
                  padding: "9px 22px",
                  borderRadius: 999,
                  fontFamily: "'Heebo',sans-serif",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                דלג להצגת התוצאה
              </button>
            </div>
          </div>
        )}

        {phase === "result" && reading && (
          <ResultView
            reading={reading}
            qSaved={qSaved}
            content={content}
            sel={sel}
            setSel={setSel}
            onReset={onReset}
          />
        )}
      </div>
    </div>
  );
}

function ResultView({
  reading,
  qSaved,
  content,
  sel,
  setSel,
  onReset,
}: {
  reading: Reading;
  qSaved: string;
  content: IChingContent;
  sel: Sel;
  setSel: (s: Sel) => void;
  onReset: () => void;
}) {
  const hasChanging = reading.changing.length > 0 && !!reading.resulting;
  const selTri = sel.kind === "tri" ? sel.tri : null;
  const panel = resolvePanel(reading, sel, content);
  const cLabel = changingLabel(reading);

  return (
    <div style={{ marginTop: 40 }}>
      {qSaved.trim() && (
        <div style={{ textAlign: "center", marginBottom: 36, animation: "fadeUp 0.5s ease both" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.2em", color: "oklch(0.55 0.03 60)", marginBottom: 8 }}>
            שְׁאֵלָתְךָ
          </div>
          <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontStyle: "italic", fontSize: 21, color: "oklch(0.34 0.04 55)" }}>
            {qSaved}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "clamp(16px,5vw,52px)",
          flexWrap: "wrap",
          animation: "fadeUp 0.6s ease both",
        }}
      >
        {/* ── הקסגרמה ראשית ── */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.24em", color: "oklch(0.55 0.03 60)", marginBottom: 16 }}>
            הַהֶקְסַגְרַמָה הָרָאשִׁית
          </div>
          <div onClick={() => setSel({ kind: "hex", which: "primary" })} style={hexBoxStyle(sel.kind === "hex" && sel.which === "primary")}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Hexagram lines={reading.lines} slots={6} big color="oklch(0.34 0.05 55)" mark="oklch(0.55 0.16 38)" stagger />
            </div>
          </div>
          <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, fontSize: 25, color: "oklch(0.24 0.03 55)", marginTop: 16 }}>
            {reading.primary.name}
          </div>
          <div style={{ fontSize: 13, color: "oklch(0.52 0.03 60)", marginTop: 2 }}>הקסגרמה {reading.primary.number}</div>
          <TrigramChips values={[reading.primary.upper, reading.primary.lower]} selTri={selTri} onSelect={(v) => setSel({ kind: "tri", tri: v })} />
        </div>

        {/* ── חץ + הקסגרמה נגזרת ── */}
        {hasChanging && reading.resulting && reading.resultLines && (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, alignSelf: "center", paddingTop: 42 }}>
              <div style={{ fontSize: 30, color: "oklch(0.70 0.12 76)", transform: "scaleX(-1)" }}>→</div>
              <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "oklch(0.55 0.03 60)", whiteSpace: "nowrap" }}>נֶעֱנוּ אֶל</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.24em", color: "oklch(0.55 0.03 60)", marginBottom: 16 }}>
                הַהֶקְסַגְרַמָה הַנִּגְזֶרֶת
              </div>
              <div onClick={() => setSel({ kind: "hex", which: "derived" })} style={hexBoxStyle(sel.kind === "hex" && sel.which === "derived")}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Hexagram lines={reading.resultLines} slots={6} big color="oklch(0.50 0.05 58)" mark="transparent" stagger />
                </div>
              </div>
              <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, fontSize: 25, color: "oklch(0.32 0.03 55)", marginTop: 16 }}>
                {reading.resulting.name}
              </div>
              <div style={{ fontSize: 13, color: "oklch(0.52 0.03 60)", marginTop: 2 }}>הקסגרמה {reading.resulting.number}</div>
              <TrigramChips values={[reading.resulting.upper, reading.resulting.lower]} selTri={selTri} onSelect={(v) => setSel({ kind: "tri", tri: v })} />
            </div>
          </>
        )}
      </div>

      {hasChanging && cLabel && (
        <div style={{ textAlign: "center", marginTop: 26, fontSize: 14, color: "oklch(0.50 0.05 50)" }}>{cLabel}</div>
      )}

      {!hasChanging && (
        <div
          style={{
            maxWidth: 520,
            margin: "26px auto 0",
            textAlign: "center",
            padding: "16px 22px",
            background: "oklch(0.95 0.022 82)",
            border: "1px solid oklch(0.88 0.022 75)",
            borderRadius: 10,
          }}
        >
          <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 17, color: "oklch(0.34 0.04 55)" }}>
            קְרִיאָה יְצִיבָה — אֵין קַוִּים מִשְׁתַּנִּים
          </div>
          <div style={{ fontSize: 14, color: "oklch(0.50 0.04 58)", marginTop: 6 }}>
            בקריאה זו לא נפלו קווים משתנים, ולכן אין הקסגרמה נגזרת. התמונה עומדת כמות שהיא.
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 32, fontSize: 13.5, color: "oklch(0.55 0.03 60)" }}>
        בחרו הקסגרמה או טריגרמה כדי לקרוא את פירושה בחלון שלמטה
      </div>

      {/* ── חלון הפירוט היחיד ── */}
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
          <div style={{ fontSize: 52, lineHeight: 1, color: "oklch(0.44 0.09 58)", fontFamily: "serif", minWidth: 52, textAlign: "center" }}>
            {panel.symbol}
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "oklch(0.58 0.06 66)", marginBottom: 5 }}>{panel.kicker}</div>
            <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, fontSize: 25, color: "oklch(0.24 0.03 55)" }}>{panel.title}</div>
            <div style={{ fontSize: 14, color: "oklch(0.52 0.03 60)", marginTop: 2 }}>{panel.sub}</div>
          </div>
        </div>
        <div style={{ height: 2, width: 54, background: "oklch(0.74 0.13 78)", marginBottom: 22 }} />

        {panel.html ? (
          <>
            <div
              className="iching-interpretation"
              style={{ fontSize: 17.5, lineHeight: 1.95, color: "oklch(0.30 0.025 55)" }}
              dangerouslySetInnerHTML={{ __html: panel.html }}
            />
            <div style={{ marginTop: 12, fontSize: 12.5, color: "oklch(0.55 0.03 60)" }}>נכתב על ידי עורך האתר</div>
          </>
        ) : (
          <p style={{ fontSize: 16, fontStyle: "italic", color: "oklch(0.52 0.04 58)", margin: 0 }}>
            הפירוש המלא בכתיבה.
          </p>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <button
          onClick={onReset}
          style={{
            padding: "14px 38px",
            fontFamily: "'Frank Ruhl Libre',serif",
            fontWeight: 700,
            fontSize: 18,
            color: "oklch(0.42 0.09 55)",
            background: "transparent",
            border: "1.5px solid oklch(0.62 0.08 60)",
            borderRadius: 999,
            cursor: "pointer",
          }}
        >
          קְרִיאָה חֲדָשָׁה
        </button>
      </div>
    </div>
  );
}
