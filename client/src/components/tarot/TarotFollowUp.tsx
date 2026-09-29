/**
 * תיבת "שְׁאֵלַת הֶמְשֵׁךְ" — מוצגת מתחת לפירוש ה-AI, רק אחרי שהתקבל פירוש.
 * המשתמש כותב שאלה (או בוחר תגית מוצעת), בלחיצה נשלף קלף מבהיר אחד ממה שנשאר בחפיסה,
 * וה-AI עונה כשכל ההקשר מולו. עד MAX_FOLLOWUPS שאלות לקריאה; אינן נספרות במכסה.
 * שום דבר לא נשמר: ההקשר חי כאן ונשלח מחדש בכל שאלה.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { marked } from "marked";
import { trpc } from "@/lib/trpc";
import {
  MAX_FOLLOWUP_LENGTH,
  followUpSuggestions,
  followUpsLeftLabel,
  type Rng,
  type SpreadChoice,
  type TarotReading,
} from "@shared/tarot";
import {
  buildFollowUpInput,
  cardPagePath,
  drawFollowUpCard,
  unusedSuggestions,
  type CardView,
  type FollowUpDraft,
  type FollowUpInput,
  type FollowUpTurn,
  type TarotContent,
} from "@/pages/tarot/model";
import { CardFace } from "./TarotCard";
import { actionButtonStyle, cardStyle, disabledButtonStyle, errorTextStyle } from "./TarotAiPanel";
import { useTarotJob } from "./useTarotJob";

const SERIF = "'Frank Ruhl Libre',serif";
const LOADING_MESSAGE = "ה-AI קורא את הקלף המבהיר מול הקריאה שלך — זה יכול לקחת עד דקה…";
/** מספר הכשלים הרצופים שאחריו מתנצלים במקום להציע ניסיון חוזר רגיל. */
const MAX_FAILURES = 3;

/** שגיאות שאינן תקלה: ניסיון חוזר מיידי לא יעזור, והן לא נספרות ככישלון. */
const BUSINESS_ERRORS = ["READING_EXPIRED", "FOLLOWUP_LIMIT", "FOLLOWUP_RATE_LIMITED", "AI_DISABLED"];

type FollowUpResult = { answer: string; followUpsLeft: number };

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const chipStyle: React.CSSProperties = {
  padding: "7px 14px",
  fontSize: 14,
  lineHeight: 1.4,
  color: "oklch(0.36 0.06 58)",
  background: "oklch(0.96 0.025 82)",
  border: "1px solid oklch(0.82 0.06 78)",
  borderRadius: 999,
  cursor: "pointer",
  fontFamily: "inherit",
};

const mutedStyle: React.CSSProperties = { fontSize: 12.5, color: "oklch(0.55 0.03 60)" };

function Header() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 24, lineHeight: 1 }}>💬</span>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 23, color: "oklch(0.24 0.03 55)" }}>
          שְׁאֵלַת הֶמְשֵׁךְ
        </div>
      </div>
      <div style={{ height: 2, width: 54, background: "oklch(0.74 0.13 78)", margin: "14px 0 20px" }} />
    </>
  );
}

/** הקלף המבהיר: תמונה קטנה, שם, שורת מהות וקישור לדף הקלף. */
function ClarifierCard({ view, animate }: { view: CardView; animate: boolean }) {
  const path = cardPagePath(view.id);
  return (
    <div
      data-testid="clarifier-card"
      data-card-id={view.id}
      style={{
        display: "flex",
        gap: 18,
        alignItems: "center",
        margin: "14px 0 18px",
        animation: animate ? "fadeUp 0.6s ease both" : "none",
      }}
    >
      <div style={{ width: "clamp(84px,22vw,120px)", flexShrink: 0 }}>
        <CardFace view={view} />
      </div>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "oklch(0.55 0.03 60)", marginBottom: 6 }}>
          הַקְּלָף הַמַּבְהִיר
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 20, color: "oklch(0.24 0.03 55)" }}>
          {view.name}
        </div>
        <div style={{ ...mutedStyle, marginTop: 2 }}>{view.suitLabel}</div>
        {view.summary.trim() && (
          <div style={{ fontSize: 15, lineHeight: 1.7, color: "oklch(0.34 0.03 55)", marginTop: 8 }}>
            {view.summary}
          </div>
        )}
        {path && (
          <Link href={path} style={{ fontSize: 13, color: "oklch(0.46 0.09 58)", marginTop: 6, display: "inline-block" }}>
            לפירוש המלא של הקלף
          </Link>
        )}
      </div>
    </div>
  );
}

function QuestionLine({ index, text }: { index: number; text: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "oklch(0.55 0.03 60)", marginBottom: 6 }}>
        שְׁאֵלַת הֶמְשֵׁךְ {index}
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 19, color: "oklch(0.34 0.04 55)" }}>
        {text}
      </div>
    </div>
  );
}

export function TarotFollowUp({
  token,
  initialLeft,
  question,
  views,
  spread,
  interpretation,
  reading,
  content,
  suggestions,
  onTurnsChange,
  rng,
}: {
  /** האסימון שהשרת הנפיק עם הפירוש — בלעדיו אין שאלות המשך. */
  token: string;
  /** כמה שאלות המשך נותרו לקריאה, כפי שהשרת דיווח עם הפירוש. */
  initialLeft: number;
  /** השאלה המקורית (יכולה להיות ריקה — קריאה כללית). */
  question: string;
  views: CardView[];
  spread: SpreadChoice;
  /** פירוש ה-AI שניתן (markdown). */
  interpretation: string;
  reading: TarotReading;
  content: TarotContent;
  /** שאלות מוצעות מותאמות; גוברות על הרשימה הקבועה כשיש לפחות שתיים. */
  suggestions?: string[];
  /** מדווח להורה על התורות שנענו — להדפסה. */
  onTurnsChange?: (turns: FollowUpTurn[]) => void;
  /** להזרקה בבדיקות. */
  rng?: Rng;
}) {
  const utils = trpc.useUtils();
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<FollowUpTurn[]>([]);
  // השאלה שבדרך והקלף שנשלף לה. נשמרת גם אחרי כישלון — ניסיון חוזר משתמש באותו קלף,
  // אחרת תקלת רשת הייתה הופכת לדרך להחליף קלף שלא מצא חן.
  const [draft, setDraft] = useState<FollowUpDraft | null>(null);
  const [left, setLeft] = useState(initialLeft);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = prefersReducedMotion();
  }, []);

  const job = useTarotJob<FollowUpInput, FollowUpResult>(
    {
      key: "followUp",
      start: (input) => utils.client.tarot.followUp.mutate(input),
      poll: (jobId) => utils.client.tarot.followUpResult.query({ jobId }),
    },
    {
      isBusinessError: (_code, message) => BUSINESS_ERRORS.includes(message),
      onDone: (result) => {
        if (!draft) return;
        const next = [...turns, { question: draft.question, card: draft.card, answer: result.answer }];
        setTurns(next);
        setDraft(null);
        setLeft(result.followUpsLeft);
        setText("");
        onTurnsChange?.(next);
      },
    },
  );

  const send = (current: FollowUpDraft) =>
    job.run(buildFollowUpInput({ token, question, views, spread, interpretation, turns, current }));

  const trimmed = text.trim();
  const canAsk = trimmed.length > 0 && !job.pending;

  function onAsk() {
    if (!canAsk) return;
    // הקלף נשלף רק עכשיו — אחרי שהשאלה נכתבה.
    const current = { question: trimmed, card: drawFollowUpCard(reading, turns, content, rng) };
    setDraft(current);
    send(current);
  }

  function onRetry() {
    if (draft) send(draft);
  }

  function onSuggestion(s: string) {
    // תגית רק ממלאת את השדה — המשתמש יכול לערוך לפני שהוא שולח ושולף.
    setText(s);
    inputRef.current?.focus();
  }

  const errorMessage = job.error?.message;
  const expired = errorMessage === "READING_EXPIRED" || errorMessage === "AI_DISABLED";
  const rateLimited = errorMessage === "FOLLOWUP_RATE_LIMITED";
  const exhausted = left <= 0 || errorMessage === "FOLLOWUP_LIMIT";
  const failed = !!job.error && !job.error.business;

  const base = suggestions && suggestions.length >= 2 ? suggestions : followUpSuggestions(spread.kind);
  const chips = unusedSuggestions(base, turns);

  return (
    <div dir="rtl" style={cardStyle} data-testid="tarot-followup">
      <Header />

      {/* ── השרשור: מה שכבר נשאל ונענה ── */}
      {turns.map((turn, i) => (
        <div
          key={`${turn.card.id}-${i}`}
          data-testid="followup-turn"
          style={{ marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid oklch(0.90 0.02 75)" }}
        >
          <QuestionLine index={i + 1} text={turn.question} />
          <ClarifierCard view={turn.card} animate={false} />
          <div
            className="iching-interpretation"
            style={{ fontSize: 17, lineHeight: 1.9, color: "oklch(0.30 0.025 55)" }}
            dangerouslySetInnerHTML={{ __html: marked.parse(turn.answer) as string }}
          />
        </div>
      ))}

      {job.pending && draft ? (
        // ── ממתין: הקלף שנשלף גלוי, התשובה בדרך ──
        <div>
          <QuestionLine index={turns.length + 1} text={draft.question} />
          <ClarifierCard view={draft.card} animate={!reduced.current} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
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
            <span style={{ fontSize: 16, fontStyle: "italic", color: "oklch(0.46 0.05 58)" }}>{LOADING_MESSAGE}</span>
          </div>
        </div>
      ) : expired ? (
        <p style={errorTextStyle}>הקריאה הזו כבר אינה פתוחה לשאלות המשך. אפשר לשלוף מחדש.</p>
      ) : exhausted ? (
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.85, color: "oklch(0.34 0.03 55)" }}>
          {turns.length >= 2
            ? "שאלת את שתי שאלות ההמשך של הקריאה הזו."
            : "שאלות ההמשך של הקריאה הזו מוצו."}{" "}
          לנושא נוסף — שליפה חדשה.
        </p>
      ) : (failed || rateLimited) && draft ? (
        // ── תקלה או עומס: השאלה והקלף נשמרים, ניסיון חוזר עם אותו קלף ──
        <div>
          <QuestionLine index={turns.length + 1} text={draft.question} />
          <ClarifierCard view={draft.card} animate={false} />
          <p style={{ ...errorTextStyle, marginBottom: 16 }}>
            {rateLimited
              ? "שאלת הרבה שאלות בשעה האחרונה. נסה שוב מאוחר יותר — הקלף שנשלף נשמר."
              : job.failures >= MAX_FAILURES
                ? "לא הצלחנו להפיק תשובה גם לאחר מספר ניסיונות — נראה ששירות ה-AI עמוס. שאלת ההמשך לא נספרה."
                : "אירעה שגיאה בקבלת התשובה. נסה שוב בעוד רגע — הקלף שנשלף נשמר."}
          </p>
          <button onClick={onRetry} style={actionButtonStyle}>
            נסה שוב
          </button>
        </div>
      ) : (
        // ── אפשר לשאול ──
        <div>
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {chips.map((s) => (
                <button key={s} type="button" data-testid="followup-chip" onClick={() => onSuggestion(s)} style={chipStyle}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_FOLLOWUP_LENGTH))}
            maxLength={MAX_FOLLOWUP_LENGTH}
            rows={2}
            dir="rtl"
            aria-label="שאלת המשך"
            placeholder="מה עוד היית רוצה להבין בקריאה הזו?"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              fontFamily: "inherit",
              fontSize: 16.5,
              lineHeight: 1.7,
              color: "oklch(0.26 0.03 55)",
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.84 0.03 75)",
              borderRadius: 10,
              resize: "vertical",
            }}
          />
          <div style={{ ...mutedStyle, textAlign: "left", marginTop: 4 }}>
            {text.length}/{MAX_FOLLOWUP_LENGTH}
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              onClick={onAsk}
              disabled={!canAsk}
              data-testid="followup-ask"
              style={canAsk ? actionButtonStyle : disabledButtonStyle}
            >
              שאל ושלוף קלף מבהיר
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 600, color: "oklch(0.46 0.09 58)" }}>
            {followUpsLeftLabel(left)} · אינן נספרות במכסה החודשית
          </div>
          <div style={{ ...mutedStyle, marginTop: 8 }}>
            השאלה והקלף נשלחים לפירוש בלחיצה זו בלבד — ואינם נשמרים.
          </div>
        </div>
      )}
    </div>
  );
}
