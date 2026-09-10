import { describe, expect, it } from "vitest";
import { cardById, draw, type TarotReading } from "@shared/tarot";
import {
  buildAiContext,
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
    expect(views[1].imageUrl).toBe("/tarot-cards/pents-09.webp?v=6");
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
