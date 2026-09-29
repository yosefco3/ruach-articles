import { describe, expect, it } from "vitest";
import { DECK_ASSETS_VERSION, cardById, draw, spreadPlan, THREE_SPREAD, type TarotReading } from "@shared/tarot";
import {
  dealPace,
  overflowNotice,
  buildAiContext,
  buildFollowUpInput,
  cardPagePath,
  drawFollowUpCard,
  unusedSuggestions,
  usedCardIds,
  type FollowUpTurn,
  choiceLayout,
  positionLabels,
  cardAltText,
  cardFallbackGlyph,
  cardPageView,
  effectiveCardName,
  resolvePanel,
  suitLabel,
  toCardViews,
  type CardTextRow,
  type TarotContent,
} from "./model";

const fool = cardById("major-00")!;
const nine = cardById("pents-09")!;

function contentWith(rows: CardTextRow[]): TarotContent {
  return {
    cards: rows,
    intro: {
      articleHtml: "",
      questionPrompt: "",
      questionHint: "",
      buttonLabel: "",
      aiEnabled: false,
    },
    aiMonthlyLimit: 5,
  };
}

function readingOf(ids: string[]): TarotReading {
  return {
    cards: ids.map((id, position) => ({
      card: cardById(id)!,
      position,
      orientation: "upright" as const,
    })),
  };
}

describe("effectiveCardName", () => {
  it("prefers a non-empty DB override and falls back to the shared Hebrew name", () => {
    expect(effectiveCardName(fool)).toBe("השוטה");
    expect(
      effectiveCardName(fool, { cardId: "major-00", name: "  ", summary: "", interpretation: "" }),
    ).toBe("השוטה");
    expect(
      effectiveCardName(fool, { cardId: "major-00", name: "ההלך", summary: "", interpretation: "" }),
    ).toBe("ההלך");
  });
});

describe("suitLabel", () => {
  it("labels minor cards with suit + element, majors as the great arcana", () => {
    expect(suitLabel(nine)).toBe("מטבעות · אדמה");
    expect(suitLabel(fool)).toBe("אַרְקָנָה גְּדוֹלָה");
  });
});

describe("toCardViews", () => {
  it("merges structure with DB text in draw order, tolerating missing rows", () => {
    const reading = readingOf(["major-00", "pents-09", "cups-02"]);
    const rows: CardTextRow[] = [
      { cardId: "pents-09", name: "", summary: "עצמאות", interpretation: "<p>פירוש</p>" },
    ];
    const views = toCardViews(reading, contentWith(rows));
    expect(views.map((v) => v.id)).toEqual(["major-00", "pents-09", "cups-02"]);
    expect(views[0].name).toBe("השוטה");
    expect(views[0].interpretationHtml).toBe(""); // אין שורת DB — לא מתפוצץ
    expect(views[1].summary).toBe("עצמאות");
    expect(views[1].imageUrl).toBe(`/tarot-cards/pents-09.webp?v=${DECK_ASSETS_VERSION}`);
    expect(views[2].suitLabel).toBe("גביעים · מים");
  });
});

describe("resolvePanel", () => {
  it("returns the selected view or null", () => {
    const views = toCardViews(readingOf(["major-00", "pents-09", "cups-02"]), contentWith([]));
    expect(resolvePanel(views, null)).toBeNull();
    expect(resolvePanel(views, 1)?.id).toBe("pents-09");
    expect(resolvePanel(views, 7)).toBeNull();
  });
});

describe("buildAiContext", () => {
  it("returns exactly 3 cards in draw order with plain-text interpretations", () => {
    const reading = readingOf(["major-00", "pents-09", "cups-02"]);
    const rows: CardTextRow[] = [
      {
        cardId: "major-00",
        name: "",
        summary: "התחלה",
        interpretation: "<h4>כותרת</h4><p>גוף&nbsp;הפירוש</p>",
      },
    ];
    const ctx = buildAiContext(toCardViews(reading, contentWith(rows)));
    expect(ctx).toHaveLength(3);
    expect(ctx[0]).toEqual({ name: "השוטה", summary: "התחלה", text: "כותרת גוף הפירוש" });
    expect(ctx[1].text).toBe("");
  });
});

describe("cardFallbackGlyph + draw integration", () => {
  it("gives every drawable card a glyph", () => {
    for (const d of draw(78, () => 0.42).cards) {
      expect(cardFallbackGlyph(d.card.id).length).toBeGreaterThan(0);
    }
    expect(cardFallbackGlyph("major-00")).toBe("✶");
    expect(cardFallbackGlyph("wands-01")).toBe("🜂");
  });
});

describe("deckSections (דף הגלריה)", () => {
  it("returns 5 sections in fixed order with full counts (22 + 4×14 = 78)", async () => {
    const { deckSections } = await import("./model");
    const sections = deckSections();
    expect(sections.map((s) => s.key)).toEqual(["major", "wands", "cups", "swords", "pents"]);
    expect(sections.map((s) => s.cards.length)).toEqual([22, 14, 14, 14, 14]);
    expect(sections[0].title).toBe("אַרְקָנָה גְּדוֹלָה");
    expect(sections[1].title).toBe("מטות · אש");
    // ארקנה גדולה בסדר מספרי; סדרות מסתיימות במלך
    expect(sections[0].cards[0].id).toBe("major-00");
    expect(sections[0].cards[21].id).toBe("major-21");
    expect(sections[4].cards[13].id).toBe("pents-king");
  });
});

describe("card page view (/tarot/card/<slug>)", () => {
  it("merges struct + DB text by slug, with rich alt", () => {
    const page = cardPageView(
      contentWith([
        { cardId: "major-00", name: "", summary: "התחלה", interpretation: "<p>גוף</p>" },
      ]),
      "the-fool",
    )!;
    expect(page.view.name).toBe("השוטה");
    expect(page.view.summary).toBe("התחלה");
    expect(page.view.interpretationHtml).toBe("<p>גוף</p>");
    expect(page.alt).toBe("קלף השוטה (The Fool) — חפיסת הטארוט של רוח חכמה");
    expect(page.view.imageUrl).toContain("/tarot-cards/major-00.webp");
  });

  it("prev/next are circular in deck order and honor name overrides", () => {
    const page = cardPageView(
      contentWith([{ cardId: "major-01", name: "המכשף", summary: "s", interpretation: "" }]),
      "the-fool",
    )!;
    expect(page.next).toEqual({ slug: "the-magician", name: "המכשף" });
    expect(page.prev.slug).toBe("king-of-pentacles"); // מעגלי: הקלף האחרון בחפיסה
  });

  it("returns null for an unknown slug", () => {
    expect(cardPageView(contentWith([]), "nope")).toBeNull();
  });

  it("cardAltText prefers the override name and keeps the en name", () => {
    expect(cardAltText(fool)).toContain("השוטה");
    expect(cardAltText(fool, "התם")).toBe("קלף התם (The Fool) — חפיסת הטארוט של רוח חכמה");
  });
});

describe("choiceLayout / positionLabels", () => {
  it("groups a 2-option plan: now=0, א׳=[1,2], ב׳=[3,4], hidden=5", () => {
    const plan = spreadPlan({ kind: "choice", options: ["לעבור", "להישאר"] });
    expect(choiceLayout(plan)).toEqual({
      now: 0,
      columns: [
        { letter: "א׳", option: "לעבור", indices: [1, 2] },
        { letter: "ב׳", option: "להישאר", indices: [3, 4] },
      ],
      hidden: 5,
    });
  });

  it("groups a 3-option plan into three columns and hidden=7", () => {
    const layout = choiceLayout(spreadPlan({ kind: "choice", options: ["א", "ב", "ג"] }))!;
    expect(layout.columns.map((c) => c.indices)).toEqual([[1, 2], [3, 4], [5, 6]]);
    expect(layout.hidden).toBe(7);
  });

  it("returns null for the three-card plan", () => {
    expect(choiceLayout(spreadPlan(THREE_SPREAD))).toBeNull();
  });

  it("positionLabels follows the plan and falls back to numbering beyond it", () => {
    expect(positionLabels(spreadPlan(THREE_SPREAD), 3)).toEqual(["קְלָף רִאשׁוֹן", "קְלָף שֵׁנִי", "קְלָף שְׁלִישִׁי"]);
    const choice = positionLabels(spreadPlan({ kind: "choice", options: ["א", "ב"] }), 6);
    expect(choice[0]).toBe("הַצֹּמֶת");
    expect(choice[1]).toBe("מָה מַצִּיעָה");
    expect(choice[5]).toBe("מָה שֶׁאֵינְךָ רוֹאֶה");
    expect(positionLabels(spreadPlan(THREE_SPREAD), 4)[3]).toBe("קְלָף 4");
  });
});

describe("follow-up question helpers", () => {
  const content = contentWith([
    { cardId: "major-00", name: "", summary: "התחלה", interpretation: "<p>פירוש <strong>השוטה</strong></p>" },
    { cardId: "pents-09", name: "תשעה", summary: "שפע", interpretation: "<p>פירוש התשעה</p>" },
  ]);
  const reading = readingOf(["major-00", "major-16", "major-17"]);
  const views = toCardViews(reading, content);
  const turn = (id: string, question: string): FollowUpTurn => ({
    question,
    card: toCardViews(readingOf([id]), content)[0],
    answer: `תשובה ל-${question}`,
  });

  it("usedCardIds covers the spread and the clarifiers already drawn", () => {
    expect(usedCardIds(reading, [])).toEqual(["major-00", "major-16", "major-17"]);
    expect(usedCardIds(reading, [turn("pents-09", "ש")])).toEqual([
      "major-00",
      "major-16",
      "major-17",
      "pents-09",
    ]);
  });

  it("drawFollowUpCard never repeats a card from the spread or from an earlier turn", () => {
    const turns = [turn("pents-09", "ש")];
    const taken = usedCardIds(reading, turns);
    for (let i = 0; i < 300; i++) {
      expect(taken).not.toContain(drawFollowUpCard(reading, turns, content).id);
    }
  });

  it("drawFollowUpCard is deterministic for a fixed rng and merges the edited text", () => {
    const a = drawFollowUpCard(reading, [], content, () => 0.5);
    const b = drawFollowUpCard(reading, [], content, () => 0.5);
    expect(a).toEqual(b);
    expect(a.imageUrl).toContain(a.id);
    expect(a.name.length).toBeGreaterThan(0);
  });

  it("buildFollowUpInput sends the whole context, with HTML turned into plain text", () => {
    const input = buildFollowUpInput({
      token: "tok",
      question: "מה נכון להבין?",
      views,
      spread: THREE_SPREAD,
      interpretation: "**פירוש**",
      turns: [turn("pents-09", "שאלה ראשונה")],
      current: { question: "  שאלה שנייה  ", card: views[0] },
    });
    expect(input.readingToken).toBe("tok");
    expect(input.question).toBe("מה נכון להבין?");
    expect(input.interpretation).toBe("**פירוש**");
    expect(input.spread).toEqual(THREE_SPREAD);
    expect(input.cards).toHaveLength(3);
    expect(input.cards[0]).toEqual({ name: "השוטה", summary: "התחלה", text: "פירוש השוטה" });
    expect(input.previous).toEqual([
      {
        question: "שאלה ראשונה",
        card: { name: "תשעה", summary: "שפע", text: "פירוש התשעה" },
        answer: "תשובה ל-שאלה ראשונה",
      },
    ]);
    expect(input.followUp.question).toBe("שאלה שנייה");
    expect(input.followUp.card.text).not.toContain("<");
  });

  it("buildFollowUpInput has no previous turns on the first follow-up", () => {
    const input = buildFollowUpInput({
      token: "tok",
      question: "",
      views,
      spread: THREE_SPREAD,
      interpretation: "פ",
      turns: [],
      current: { question: "ש", card: views[1] },
    });
    expect(input.previous).toEqual([]);
    expect(input.question).toBe("");
  });

  it("unusedSuggestions drops questions that were already asked", () => {
    const list = ["מה מעכב אותי כאן?", "מה הצעד הראשון שנכון לעשות?"];
    expect(unusedSuggestions(list, [])).toEqual(list);
    expect(unusedSuggestions(list, [turn("pents-09", " מה מעכב אותי כאן? ")])).toEqual([
      "מה הצעד הראשון שנכון לעשות?",
    ]);
  });

  it("cardPagePath links to the card page, or null for an unknown id", () => {
    expect(cardPagePath("major-00")).toMatch(/^\/tarot\/card\/[a-z0-9-]+$/);
    expect(cardPagePath("nope")).toBeNull();
  });
});

describe("overflowNotice — more options than the choice spread compares", () => {
  it("explains why three cards were dealt", () => {
    const text = overflowNotice({ kind: "three", options: [], overflow: 7 })!;
    expect(text).toContain("7 אפשרויות");
    expect(text).toContain("עד 6 דרכים");
    expect(text).toContain("שלושה קלפים");
    expect(text).toContain("שלפו שוב");
  });

  it("is silent for ordinary readings", () => {
    expect(overflowNotice(THREE_SPREAD)).toBeNull();
    expect(overflowNotice({ kind: "choice", options: ["א", "ב"] })).toBeNull();
    expect(overflowNotice({ kind: "three", options: [], overflow: 5 })).toBeNull();
  });
});

describe("dealPace", () => {
  it("keeps the default pace up to 10 cards and speeds up the larger spreads", () => {
    expect(dealPace(3)).toEqual({});
    expect(dealPace(10)).toEqual({});
    expect(dealPace(12)).toEqual({ dealMs: 250, flipMs: 600 });
    expect(dealPace(14)).toEqual({ dealMs: 250, flipMs: 600 });
  });
});
