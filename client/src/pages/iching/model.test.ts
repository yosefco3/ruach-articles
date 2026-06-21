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
    { number: 2, trigramExplanation: "te2", interpretation: "<p>kabbala</p>", changingLinesNote: "" },
    { number: 1, trigramExplanation: "te1", interpretation: "<p>yetzira</p>", changingLinesNote: "" },
  ],
  trigrams: [{ trigramKey: "kun", description: "<p>kun desc</p>" }],
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
    const label = changingLabel(changingReading);
    expect(label).toContain("קווים משתנים");
    expect(label).toContain(changingReading.primary.name);
    expect(label).toContain(changingReading.resulting!.name);
  });
  it("returns null for a stable reading (no derived hexagram)", () => {
    expect(stableReading.changing).toEqual([]);
    expect(changingLabel(stableReading)).toBeNull();
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
