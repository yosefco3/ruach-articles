import { describe, it, expect } from "vitest";
import { cast, TRIGRAMS, type Reading } from "@shared/iching";
import { appRouter } from "../../../../server/routers";
import {
  DEFAULT_SEL,
  findHexText,
  findTriText,
  lineRenderOrder,
  resolvePanel,
  changingLabel,
  effectiveTrigram,
  effectiveHexName,
  relationForEffective,
  type IChingContent,
} from "./model";

function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

// כל הקווים יין-משתנה → ראשית #2 (אדמה), נגזרת #1 (הכל נהפך ליאנג).
const changingReading: Reading = cast(seqRng([0.9]));
// כל הקווים sum 8 (יין יציב) → אין קווים משתנים.
const stableReading: Reading = cast(seqRng([0, 0, 0.9]));

const content: IChingContent = {
  hexagrams: [
    { number: 2, name: "", trigramExplanation: "te2", interpretation: "<p>kabbala</p>", changingLinesNote: "" },
    { number: 1, name: "", trigramExplanation: "te1", interpretation: "<p>yetzira</p>", changingLinesNote: "" },
  ],
  trigrams: [{ trigramKey: "kun", name: "", element: "", attr: "", description: "<p>kun desc</p>" }],
  intro: { articleHtml: "<p>a</p>", questionPrompt: "q", questionHint: "h", buttonLabel: "b" },
};

describe("line ordering", () => {
  it("renders bottom-up: line 1 (index 5..0)", () => {
    expect(lineRenderOrder(6)).toEqual([5, 4, 3, 2, 1, 0]);
  });
});

describe("text lookup", () => {
  it("findHexText matches by King Wen number", () => {
    expect(findHexText(content.hexagrams, 2)?.interpretation).toBe("<p>kabbala</p>");
    expect(findHexText(content.hexagrams, 64)).toBeUndefined();
  });
  it("findTriText maps trigram value → DB key", () => {
    const kunValue = TRIGRAMS.findIndex((t) => t.key === "kun");
    expect(findTriText(content.trigrams, kunValue)?.description).toBe("<p>kun desc</p>");
  });
});

describe("resolvePanel — merge structure + DB text", () => {
  it("default selection shows the primary hexagram interpretation from DB", () => {
    expect(changingReading.primary.number).toBe(2);
    const panel = resolvePanel(changingReading, DEFAULT_SEL, content);
    expect(panel.kicker).toBe("פֵּרוּשׁ הַהֶקְסַגְרַמָה");
    expect(panel.title).toBe(changingReading.primary.name);
    expect(panel.html).toBe("<p>kabbala</p>");
  });

  it("selecting the derived box switches the panel to the resulting hexagram", () => {
    expect(changingReading.resulting?.number).toBe(1);
    const panel = resolvePanel(changingReading, { kind: "hex", which: "derived" }, content);
    expect(panel.html).toBe("<p>yetzira</p>");
  });

  it("selecting a trigram chip shows that trigram's description", () => {
    const kunValue = TRIGRAMS.findIndex((t) => t.key === "kun");
    const panel = resolvePanel(changingReading, { kind: "tri", tri: kunValue }, content);
    expect(panel.kicker).toBe("פֵּרוּשׁ הַטְּרִיגְרַמָה");
    expect(panel.html).toBe("<p>kun desc</p>");
  });

  it("falls back to null html when the text has not been written yet", () => {
    const sparse: IChingContent = { ...content, hexagrams: [] };
    expect(resolvePanel(changingReading, DEFAULT_SEL, sparse).html).toBeNull();
  });
});

describe("changing-lines label", () => {
  it("describes the movement when there are changing lines", () => {
    const label = changingLabel(changingReading, content);
    expect(label).toContain("קווים משתנים");
    expect(label).toContain(changingReading.primary.name);
    expect(label).toContain(changingReading.resulting!.name);
  });
  it("returns null for a stable reading (no derived hexagram)", () => {
    expect(stableReading.changing).toEqual([]);
    expect(changingLabel(stableReading, content)).toBeNull();
  });
});

describe("editable name overrides (DB override → fallback to shared)", () => {
  const kunValue = TRIGRAMS.findIndex((t) => t.key === "kun");

  it("effectiveHexName uses the DB override when present, else the shared name", () => {
    expect(effectiveHexName(2, content.hexagrams)).toBe("הַקַּבָּלָה"); // ריק ב-DB → ברירת מחדל מ-shared
    const overridden = [{ ...content.hexagrams[0], name: "שֵׁם חָדָשׁ" }, content.hexagrams[1]];
    expect(effectiveHexName(2, overridden)).toBe("שֵׁם חָדָשׁ");
  });

  it("effectiveTrigram overrides name/element/attr, keeping the fixed symbol", () => {
    const base = effectiveTrigram(kunValue, content.trigrams);
    expect(base.name).toBe(TRIGRAMS[kunValue].name); // ריק ב-DB → ברירת מחדל
    const overridden = [{ trigramKey: "kun", name: "אֵם", element: "קַרְקַע", attr: "נְשִׂיאָה", description: "" }];
    const eff = effectiveTrigram(kunValue, overridden);
    expect(eff.name).toBe("אֵם");
    expect(eff.element).toBe("קַרְקַע");
    expect(eff.symbol).toBe(TRIGRAMS[kunValue].symbol); // הסמל קבוע
  });

  it("relationForEffective reflects an overridden element", () => {
    const overridden = [{ trigramKey: "kun", name: "", element: "קַרְקַע", attr: "", description: "" }];
    // kun מול kun → "<element> כְּפוּלָה"
    expect(relationForEffective(kunValue, kunValue, overridden)).toBe("קַרְקַע כְּפוּלָה");
  });

  it("the panel title follows the hexagram name override", () => {
    const overridden: IChingContent = {
      ...content,
      hexagrams: [{ ...content.hexagrams[0], name: "שֵׁם עָרוּךְ" }, content.hexagrams[1]],
    };
    expect(resolvePanel(changingReading, DEFAULT_SEL, overridden).title).toBe("שֵׁם עָרוּךְ");
  });
});

describe("the question is never sent to the server", () => {
  it("exposes only a content query + admin mutations — no procedure receives a question", () => {
    const ichingKeys = Object.keys(appRouter._def.procedures).filter((k) => k.startsWith("iching."));
    expect(ichingKeys.sort()).toEqual(
      ["iching.getContent", "iching.updateIntro", "iching.upsertHexagram", "iching.upsertTrigram"].sort(),
    );
    // הקריאה הציבורית היחידה היא query ללא קלט שאלה.
    expect(appRouter._def.procedures["iching.getContent"]._def.type).toBe("query");
  });
});
