/**
 * דף עריכת הטארוט לאדמין — במבנה של AdminIChing, מחובר ל-tRPC+DB.
 * שני אזורים: מאמר מבוא (+מתג AI) · 78 קלפים (מקובצים לפי ארקנה/סדרה, עם חיפוש
 * וסימון חוסר טקסט). כל אזור כולל תצוגה מקדימה חיה של מה שהקורא יראה ב-/tarot.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/RichTextEditor";
import { CARDS, SUITS, cardImagePath, type CardStruct, type Suit } from "@shared/tarot";
import {
  effectiveCardName,
  findCardText,
  suitLabel,
  type TarotContent,
} from "@/pages/tarot/model";

type Area = "intro" | "cards";

const GROUPS: { key: "major" | Suit; label: string }[] = [
  { key: "major", label: "אַרְקָנָה גְּדוֹלָה" },
  { key: "wands", label: `${SUITS.wands.he} (${SUITS.wands.element})` },
  { key: "cups", label: `${SUITS.cups.he} (${SUITS.cups.element})` },
  { key: "swords", label: `${SUITS.swords.he} (${SUITS.swords.element})` },
  { key: "pents", label: `${SUITS.pents.he} (${SUITS.pents.element})` },
];

function groupOf(c: CardStruct): "major" | Suit {
  return c.arcana === "major" ? "major" : c.suit!;
}

/** תצוגת חלון פירוש הקלף (כמו ב-/tarot) לתצוגה מקדימה. */
function CardDetailPreview({
  struct,
  name,
  summary,
  html,
}: {
  struct: CardStruct;
  name: string;
  summary: string;
  html: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
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
        {imgFailed ? (
          <div
            style={{
              width: 56,
              aspectRatio: "2 / 3",
              borderRadius: 6,
              background: "radial-gradient(120% 120% at 50% 0%, oklch(0.30 0.045 58), oklch(0.18 0.03 55))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "oklch(0.85 0.09 82)",
              fontSize: 20,
            }}
          >
            ✶
          </div>
        ) : (
          <img
            src={cardImagePath(struct.id)}
            alt=""
            onError={() => setImgFailed(true)}
            style={{ width: 56, aspectRatio: "2 / 3", objectFit: "cover", borderRadius: 6 }}
          />
        )}
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "oklch(0.58 0.06 66)", marginBottom: 4 }}>
            פֵּרוּשׁ הַקְּלָף
          </div>
          <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, fontSize: 23, color: "oklch(0.24 0.03 55)" }}>
            {name}
          </div>
          <div style={{ fontSize: 13, color: "oklch(0.52 0.03 60)", marginTop: 2 }}>
            {suitLabel(struct)}
            {summary.trim() ? ` · ${summary}` : ""}
          </div>
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

export default function AdminTarot() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.tarot.getContent.useQuery();
  const content = data as TarotContent | undefined;

  const [area, setArea] = useState<Area>("intro");

  // ── מבוא ──
  const [articleHtml, setArticleHtml] = useState("");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questionHint, setQuestionHint] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  useEffect(() => {
    if (content) {
      setArticleHtml(content.intro.articleHtml);
      setQuestionPrompt(content.intro.questionPrompt);
      setQuestionHint(content.intro.questionHint);
      setButtonLabel(content.intro.buttonLabel);
      setAiEnabled(content.intro.aiEnabled);
    }
  }, [content]);

  // ── קלף נבחר ──
  const [cardId, setCardId] = useState(CARDS[0].id);
  const [search, setSearch] = useState("");
  const [cardName, setCardName] = useState("");
  const [summary, setSummary] = useState("");
  const [interpretation, setInterpretation] = useState("");
  useEffect(() => {
    if (content) {
      const t = findCardText(content.cards, cardId);
      setCardName(t?.name ?? "");
      setSummary(t?.summary ?? "");
      setInterpretation(t?.interpretation ?? "");
    }
  }, [content, cardId]);

  const missing = useMemo(() => {
    const set = new Set<string>();
    if (content) {
      for (const c of CARDS) {
        const t = findCardText(content.cards, c.id);
        if (!t || !t.interpretation.trim()) set.add(c.id);
      }
    }
    return set;
  }, [content]);

  const filteredCards = useMemo(() => {
    const q = search.trim();
    return CARDS.filter((c) => !q || c.he.includes(q) || c.en.toLowerCase().includes(q.toLowerCase()) || c.id.includes(q));
  }, [search]);

  const updateIntro = trpc.tarot.updateIntro.useMutation({
    onSuccess: () => {
      utils.tarot.getContent.invalidate();
      toast.success("מאמר המבוא נשמר");
    },
    onError: (e) => toast.error(e.message || "שגיאה בשמירת המבוא"),
  });
  const upsertCard = trpc.tarot.upsertCard.useMutation({
    onSuccess: () => {
      utils.tarot.getContent.invalidate();
      toast.success("פירוש הקלף נשמר");
    },
    onError: (e) => toast.error(e.message || "שגיאה בשמירת הקלף"),
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

  const struct = CARDS.find((c) => c.id === cardId)!;
  const shownName = cardName.trim() || struct.he;

  return (
    <div className="container max-w-5xl py-12">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="font-display font-bold text-3xl text-foreground">ניהול טָארוֹט</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border">
        {(["intro", "cards"] as Area[]).map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`px-4 py-2 font-medium transition-colors ${
              area === a ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {a === "intro" ? "מאמר מבוא" : "קלפים"}
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
              <label className={SECTION_LABEL}>תווית כפתור השליפה</label>
              <Input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} dir="rtl" className="text-right" />
            </div>
            <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-4" dir="rtl">
              <div>
                <p className="font-medium text-sm text-foreground">פירוש AI לפריסה</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {aiEnabled
                    ? "הקורא יכול לקבל פירוש AI לפריסה שלו — לצד פירושי הקלפים"
                    : "כבוי — מוצגים רק פירושי הקלפים, ללא כל קריאת AI"}
                </p>
              </div>
              <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => updateIntro.mutate({ articleHtml, questionPrompt, questionHint, buttonLabel, aiEnabled })}
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

      {/* ── קלפים ── */}
      {area === "cards" && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* רשימה מקובצת + חיפוש */}
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש קלף…" dir="rtl" className="pr-9 text-right" />
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {GROUPS.map((g) => {
                const group = filteredCards.filter((c) => groupOf(c) === g.key);
                if (!group.length) return null;
                return (
                  <div key={g.key}>
                    <div className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground sticky top-0 bg-card">
                      {g.label}
                    </div>
                    {group.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCardId(c.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                          cardId === c.id ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-accent"
                        }`}
                      >
                        <span className="flex-1">
                          <span className="block text-sm font-medium text-foreground">
                            {effectiveCardName(c, findCardText(content.cards, c.id))}
                          </span>
                          <span className="block text-xs text-muted-foreground">{c.en}</span>
                        </span>
                        {missing.has(c.id) && <span className="text-[10px] text-amber-600 font-medium">חסר</span>}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* עורך + תצוגה מקדימה */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-display font-bold text-xl text-foreground">{shownName}</div>
                  <div className="text-sm text-muted-foreground">
                    {struct.en} · {suitLabel(struct)}
                  </div>
                </div>
              </div>
              <div>
                <label className={SECTION_LABEL}>שם הקלף</label>
                <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder={struct.he} dir="rtl" className="text-right" />
                <p className="text-xs text-muted-foreground mt-1">השאר ריק כדי להשתמש בשם ברירת המחדל ({struct.he}).</p>
              </div>
              <div>
                <label className={SECTION_LABEL}>שורת מהות (מוצגת מתחת לשם הקלף)</label>
                <Input value={summary} onChange={(e) => setSummary(e.target.value)} dir="rtl" className="text-right" />
              </div>
              <div>
                <label className={SECTION_LABEL}>פירוש הקלף</label>
                <RichTextEditor value={interpretation} onChange={setInterpretation} />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => upsertCard.mutate({ cardId, name: cardName, summary, interpretation })}
                  disabled={upsertCard.isPending}
                  className="gap-2"
                >
                  {upsertCard.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  שמור קלף
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">תצוגה מקדימה</p>
              <CardDetailPreview struct={struct} name={shownName} summary={summary} html={interpretation} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
