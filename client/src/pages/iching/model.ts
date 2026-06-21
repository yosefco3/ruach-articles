/**
 * לוגיקת מיזוג מבנה (shared/iching) + טקסט (DB) עבור דף הקריאה — טהורה וניתנת לבדיקה.
 * הקומפוננטות (IChingReading/Hexagram/Coins) דקות מעל המודול הזה.
 */
import { TRIGRAMS, relationFor, type Reading } from "@shared/iching";

export interface HexText {
  number: number;
  trigramExplanation: string;
  interpretation: string;
  changingLinesNote: string;
}
export interface TriText {
  trigramKey: string;
  description: string;
}
export interface IChingIntro {
  articleHtml: string;
  questionPrompt: string;
  questionHint: string;
  buttonLabel: string;
}
export interface IChingContent {
  hexagrams: HexText[];
  trigrams: TriText[];
  intro: IChingIntro;
}

/** בחירת התצוגה: הקסגרמה ראשית/נגזרת, או טריגרמה לפי ערך 0..7. */
export type Sel =
  | { kind: "hex"; which: "primary" | "derived" }
  | { kind: "tri"; tri: number };

export const DEFAULT_SEL: Sel = { kind: "hex", which: "primary" };

export function findHexText(hexagrams: HexText[], n: number): HexText | undefined {
  return hexagrams.find((h) => h.number === n);
}
export function findTriText(trigrams: TriText[], value: number): TriText | undefined {
  return trigrams.find((t) => t.trigramKey === TRIGRAMS[value].key);
}

/** סדר הרינדור של הקווים: מלמטה למעלה — אינדקס slots-1 … 0 (קו 1 בתחתית). */
export function lineRenderOrder(slots = 6): number[] {
  return Array.from({ length: slots }, (_, k) => slots - 1 - k);
}

export interface Panel {
  kicker: string; // "פֵּרוּשׁ הַהֶקְסַגְרַמָה" / "פֵּרוּשׁ הַטְּרִיגְרַמָה"
  symbol: string; // גליף הקסגרמה / סמל טריגרמה
  title: string; // שם מנוקד
  sub: string; // יחס + מספר / element · attr
  html: string | null; // HTML מה-DB; null כשהטקסט טרם נכתב
}

/** מה שחלון הפירוט היחיד מציג לפי הבחירה — מבנה מ-reading, טקסט מה-DB. */
export function resolvePanel(reading: Reading, sel: Sel, content: IChingContent): Panel {
  if (sel.kind === "tri") {
    const t = TRIGRAMS[sel.tri];
    const txt = findTriText(content.trigrams, sel.tri);
    return {
      kicker: "פֵּרוּשׁ הַטְּרִיגְרַמָה",
      symbol: t.symbol,
      title: t.name,
      sub: `${t.element} · ${t.attr}`,
      html: txt?.description ?? null,
    };
  }
  const hx = sel.which === "derived" && reading.resulting ? reading.resulting : reading.primary;
  const rel = relationFor(hx.lower, hx.upper);
  const txt = findHexText(content.hexagrams, hx.number);
  return {
    kicker: "פֵּרוּשׁ הַהֶקְסַגְרַמָה",
    symbol: hx.glyph,
    title: hx.name,
    sub: `${rel} · הקסגרמה ${hx.number}`,
    html: txt?.interpretation ?? null,
  };
}

/** תווית "קווים משתנים: קו N · … — הקריאה נעה מ«...» אל «...»". */
export function changingLabel(reading: Reading): string | null {
  if (!reading.changing.length || !reading.resulting) return null;
  const lines = reading.changing.map((n) => `קו ${n}`).join(" · ");
  return `קווים משתנים: ${lines} — הקריאה נעה מ«${reading.primary.name}» אל «${reading.resulting.name}».`;
}
