/**
 * דף עריכת האי-צ'ינג לאדמין — פורט ממסך ה-admin באב-טיפוס, מחובר ל-tRPC+DB.
 * שלושה אזורים: מאמר מבוא · 8 טריגרמות · 64 הקסגרמות (עם חיפוש וסימון חוסר טקסט).
 * כל אזור כולל תצוגה מקדימה חיה של מה שהקורא יראה ב-/iching.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import {
  HEXAGRAMS,
  TRIGRAMS,
  relationFor,
  type TrigramKey,
} from "@shared/iching";
import { findHexText, findTriText, type IChingContent } from "@/pages/iching/model";

type Area = "intro" | "trigrams" | "hexagrams";

// ── תצוגת חלון הפירוט (כמו ב-/iching) לתצוגה מקדימה ──
function DetailPanel({
  kicker,
  symbol,
  title,
  sub,
  html,
}: {
  kicker: string;
  symbol: string;
  title: string;
  sub: string;
  html: string;
}) {
  return (
    <div
      style={{
        background: "oklch(0.99 0.008 80)",
        border: "1px solid oklch(0.86 0.024 75)",
        borderRadius: 14,
        padding: "28px 26px",
      }}
      dir="rtl"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 46, lineHeight: 1, color: "oklch(0.44 0.09 58)", fontFamily: "serif", minWidth: 46, textAlign: "center" }}>
          {symbol}
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "oklch(0.58 0.06 66)", marginBottom: 4 }}>{kicker}</div>
          <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, fontSize: 23, color: "oklch(0.24 0.03 55)" }}>{title}</div>
          <div style={{ fontSize: 13, color: "oklch(0.52 0.03 60)", marginTop: 2 }}>{sub}</div>
        </div>
      </div>
      <div style={{ height: 2, width: 54, background: "oklch(0.74 0.13 78)", marginBottom: 18 }} />
      {html.trim() ? (
        <div style={{ fontSize: 16.5, lineHeight: 1.9, color: "oklch(0.30 0.025 55)" }} dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p style={{ fontSize: 15, fontStyle: "italic", color: "oklch(0.55 0.04 58)", margin: 0 }}>הפירוש המלא בכתיבה.</p>
      )}
    </div>
  );
}

const SECTION_LABEL = "block text-sm font-medium text-foreground mb-2";

export default function AdminIChing() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.iching.getContent.useQuery();
  const content = data as IChingContent | undefined;

  const [area, setArea] = useState<Area>("intro");

  // ── מבוא ──
  const [articleHtml, setArticleHtml] = useState("");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questionHint, setQuestionHint] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  useEffect(() => {
    if (content) {
      setArticleHtml(content.intro.articleHtml);
      setQuestionPrompt(content.intro.questionPrompt);
      setQuestionHint(content.intro.questionHint);
      setButtonLabel(content.intro.buttonLabel);
    }
  }, [content]);

  // ── טריגרמה נבחרת ──
  const [triValue, setTriValue] = useState(0);
  const [triDesc, setTriDesc] = useState("");
  useEffect(() => {
    if (content) setTriDesc(findTriText(content.trigrams, triValue)?.description ?? "");
  }, [content, triValue]);

  // ── הקסגרמה נבחרת ──
  const [hexNumber, setHexNumber] = useState(1);
  const [search, setSearch] = useState("");
  const [trigramExplanation, setTrigramExplanation] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [changingLinesNote, setChangingLinesNote] = useState("");
  useEffect(() => {
    if (content) {
      const t = findHexText(content.hexagrams, hexNumber);
      setTrigramExplanation(t?.trigramExplanation ?? "");
      setInterpretation(t?.interpretation ?? "");
      setChangingLinesNote(t?.changingLinesNote ?? "");
    }
  }, [content, hexNumber]);

  const hexMissing = useMemo(() => {
    const set = new Set<number>();
    if (content) {
      for (const h of HEXAGRAMS) {
        const t = findHexText(content.hexagrams, h.number);
        if (!t || !t.interpretation.trim()) set.add(h.number);
      }
    }
    return set;
  }, [content]);

  const filteredHexes = useMemo(() => {
    const q = search.trim();
    return HEXAGRAMS.filter((h) => !q || h.name.includes(q) || String(h.number) === q);
  }, [search]);

  const updateIntro = trpc.iching.updateIntro.useMutation({
    onSuccess: () => {
      utils.iching.getContent.invalidate();
      toast.success("מאמר המבוא נשמר");
    },
    onError: (e) => toast.error(e.message || "שגיאה בשמירת המבוא"),
  });
  const upsertTrigram = trpc.iching.upsertTrigram.useMutation({
    onSuccess: () => {
      utils.iching.getContent.invalidate();
      toast.success("תיאור הטריגרמה נשמר");
    },
    onError: (e) => toast.error(e.message || "שגיאה בשמירת הטריגרמה"),
  });
  const upsertHexagram = trpc.iching.upsertHexagram.useMutation({
    onSuccess: () => {
      utils.iching.getContent.invalidate();
      toast.success("פירוש ההקסגרמה נשמר");
    },
    onError: (e) => toast.error(e.message || "שגיאה בשמירת ההקסגרמה"),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container py-24 text-center">
        <p className="text-xl font-display font-bold text-foreground mb-2">גישה מוגבלת</p>
        <p className="text-muted-foreground mb-6">עמוד זה זמין למנהלים בלבד</p>
        <Button variant="outline" onClick={() => navigate("/")}>חזרה לדף הבית</Button>
      </div>
    );
  }
  if (isLoading || !content) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tri = TRIGRAMS[triValue];
  const hex = HEXAGRAMS.find((h) => h.number === hexNumber)!;

  return (
    <div className="container max-w-5xl py-12">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="font-display font-bold text-3xl text-foreground">ניהול אִי צִ׳ינְג</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border">
        {(["intro", "trigrams", "hexagrams"] as Area[]).map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`px-4 py-2 font-medium transition-colors ${
              area === a ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {a === "intro" ? "מאמר מבוא" : a === "trigrams" ? "טריגרמות" : "הקסגרמות"}
          </button>
        ))}
      </div>

      {/* ── מאמר מבוא ── */}
      {area === "intro" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <label className={SECTION_LABEL}>מאמר המבוא</label>
              <RichTextEditor value={articleHtml} onChange={setArticleHtml} />
            </div>
            <div>
              <label className={SECTION_LABEL}>תווית השאלה</label>
              <Input value={questionPrompt} onChange={(e) => setQuestionPrompt(e.target.value)} dir="rtl" className="text-right" />
            </div>
            <div>
              <label className={SECTION_LABEL}>הערת פרטיות</label>
              <Input value={questionHint} onChange={(e) => setQuestionHint(e.target.value)} dir="rtl" className="text-right" />
            </div>
            <div>
              <label className={SECTION_LABEL}>תווית כפתור ההטלה</label>
              <Input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} dir="rtl" className="text-right" />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => updateIntro.mutate({ articleHtml, questionPrompt, questionHint, buttonLabel })}
                disabled={updateIntro.isPending}
                className="gap-2"
              >
                {updateIntro.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                שמור מבוא
              </Button>
            </div>
          </div>

          {/* תצוגה מקדימה — מסך הכניסה */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">תצוגה מקדימה</p>
            <div style={{ background: "oklch(0.97 0.014 85)", borderRadius: 14, padding: 24 }} dir="rtl">
              <div style={{ fontSize: 18, lineHeight: 1.95, color: "oklch(0.30 0.025 55)" }} dangerouslySetInnerHTML={{ __html: articleHtml }} />
              <label style={{ display: "block", fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 20, margin: "20px 0 10px", color: "oklch(0.26 0.03 55)" }}>
                {questionPrompt}
              </label>
              <div style={{ fontSize: 13, color: "oklch(0.54 0.03 60)" }}>🔒 {questionHint}</div>
              <div style={{ marginTop: 16, textAlign: "center", padding: 14, color: "oklch(0.98 0.008 80)", background: "linear-gradient(135deg, oklch(0.48 0.10 58), oklch(0.40 0.09 52))", borderRadius: 10, fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700 }}>
                {buttonLabel}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── טריגרמות ── */}
      {area === "trigrams" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              {TRIGRAMS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTriValue(t.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    triValue === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary"
                  }`}
                >
                  {t.symbol} {t.name}
                </button>
              ))}
            </div>
            <div>
              <label className={SECTION_LABEL}>תיאור {tri.name} ({tri.element})</label>
              <RichTextEditor value={triDesc} onChange={setTriDesc} />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => upsertTrigram.mutate({ trigramKey: tri.key as TrigramKey, description: triDesc })}
                disabled={upsertTrigram.isPending}
                className="gap-2"
              >
                {upsertTrigram.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                שמור טריגרמה
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">תצוגה מקדימה</p>
            <DetailPanel kicker="פֵּרוּשׁ הַטְּרִיגְרַמָה" symbol={tri.symbol} title={tri.name} sub={`${tri.element} · ${tri.attr}`} html={triDesc} />
          </div>
        </div>
      )}

      {/* ── הקסגרמות ── */}
      {area === "hexagrams" && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* רשימה + חיפוש */}
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש הקסגרמה…" dir="rtl" className="pr-9 text-right" />
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredHexes.map((h) => (
                <button
                  key={h.number}
                  onClick={() => setHexNumber(h.number)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                    hexNumber === h.number ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-accent"
                  }`}
                >
                  <span style={{ fontFamily: "serif", fontSize: 22 }}>{h.glyph}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {h.number}. {h.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">{relationFor(h.lower, h.upper)}</span>
                  </span>
                  {hexMissing.has(h.number) && <span className="text-[10px] text-amber-600 font-medium">חסר</span>}
                </button>
              ))}
            </div>
          </div>

          {/* עורך + תצוגה מקדימה */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: "serif", fontSize: 34 }}>{hex.glyph}</span>
                <div>
                  <div className="font-display font-bold text-xl text-foreground">{hex.number}. {hex.name}</div>
                  <div className="text-sm text-muted-foreground">{relationFor(hex.lower, hex.upper)}</div>
                </div>
              </div>
              <div>
                <label className={SECTION_LABEL}>הטריגרמות</label>
                <Textarea value={trigramExplanation} onChange={(e) => setTrigramExplanation(e.target.value)} dir="rtl" className="text-right min-h-[120px]" />
              </div>
              <div>
                <label className={SECTION_LABEL}>פירוש ההקסגרמה (מסרים מרכזיים + יישום מעשי)</label>
                <RichTextEditor value={interpretation} onChange={setInterpretation} />
              </div>
              <div>
                <label className={SECTION_LABEL}>קווים משתנים (אופציונלי)</label>
                <Textarea value={changingLinesNote} onChange={(e) => setChangingLinesNote(e.target.value)} dir="rtl" className="text-right min-h-[80px]" />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() =>
                    upsertHexagram.mutate({ number: hex.number, trigramExplanation, interpretation, changingLinesNote })
                  }
                  disabled={upsertHexagram.isPending}
                  className="gap-2"
                >
                  {upsertHexagram.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  שמור פירוש
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">תצוגה מקדימה</p>
              <DetailPanel
                kicker="פֵּרוּשׁ הַהֶקְסַגְרַמָה"
                symbol={hex.glyph}
                title={hex.name}
                sub={`${relationFor(hex.lower, hex.upper)} · הקסגרמה ${hex.number}`}
                html={interpretation}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
