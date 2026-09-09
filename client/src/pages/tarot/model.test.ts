import { describe, expect, it } from "vitest";
import { cardById, draw, type TarotReading } from "@shared/tarot";
import {
  buildAiContext,
  cardFallbackGlyph,
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
    expect(views[1].imageUrl).toBe("/tarot-cards/pents-09.webp");
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
