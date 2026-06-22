/**
 * לוגיקת מיזוג מבנה (shared/iching) + טקסט (DB) עבור דף הקריאה — טהורה וניתנת לבדיקה.
 * הקומפוננטות (IChingReading/Hexagram/Coins) דקות מעל המודול הזה.
 */
import { TRIGRAMS, HEX_NAMES, type Reading } from "@shared/iching";

export interface HexText {
  number: number;
  name: string; // override לשם; ריק = ברירת המחדל מ-shared
  trigramExplanation: string;
  interpretation: string;
  changingLinesNote: string;
}
export interface TriText {
  trigramKey: string;
  name: string; // override; ריק = ברירת המחדל מ-shared
  element: string;
  attr: string;
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

// ── שמות אפקטיביים: override מה-DB אם קיים, אחרת ברירת המחדל הקבועה מ-shared ──
export interface EffectiveTrigram {
  value: number;
  symbol: string;
  name: string;
  element: string;
  attr: string;
}

/** הטריגרמה כפי שתוצג: סמל קבוע מ-shared, שם/יסוד/תכונה עם override מה-DB. */
export function effectiveTrigram(value: number, trigrams: TriText[]): EffectiveTrigram {
  const base = TRIGRAMS[value];
  const ov = findTriText(trigrams, value);
  return {
    value,
    symbol: base.symbol,
    name: ov?.name.trim() ? ov.name : base.name,
    element: ov?.element.trim() ? ov.element : base.element,
    attr: ov?.attr.trim() ? ov.attr : base.attr,
  };
}

/** שם ההקסגרמה כפי שיוצג: override מה-DB אם קיים, אחרת `HEX_NAMES` מ-shared. */
export function effectiveHexName(number: number, hexagrams: HexText[]): string {
  const ov = findHexText(hexagrams, number);
  return ov?.name.trim() ? ov.name : HEX_NAMES[number];
}

/** תווית היחס ("אֵשׁ מֵעַל שָׁמַיִם") עם היסודות האפקטיביים (override מה-DB). */
export function relationForEffective(lower: number, upper: number, trigrams: TriText[]): string {
  const lo = effectiveTrigram(lower, trigrams).element;
  const up = effectiveTrigram(upper, trigrams).element;
  if (lower === upper) return up + " כְּפוּלָה";
  return up + " מֵעַל " + lo;
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
    const t = effectiveTrigram(sel.tri, content.trigrams);
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
  const rel = relationForEffective(hx.lower, hx.upper, content.trigrams);
  const txt = findHexText(content.hexagrams, hx.number);
  return {
    kicker: "פֵּרוּשׁ הַהֶקְסַגְרַמָה",
    symbol: hx.glyph,
    title: effectiveHexName(hx.number, content.hexagrams),
    sub: `${rel} · הקסגרמה ${hx.number}`,
    html: txt?.interpretation ?? null,
  };
}

/** תווית "קווים משתנים: קו N · … — הקריאה נעה מ«...» אל «...»". */
export function changingLabel(reading: Reading, content: IChingContent): string | null {
  if (!reading.changing.length || !reading.resulting) return null;
  const lines = reading.changing.map((n) => `קו ${n}`).join(" · ");
  const from = effectiveHexName(reading.primary.number, content.hexagrams);
  const to = effectiveHexName(reading.resulting.number, content.hexagrams);
  return `קווים משתנים: ${lines} — הקריאה נעה מ«${from}» אל «${to}».`;
}

// ── הזרקת קונטקסט לפירוש ה-AI: מחלצים מהתוכן הסטטי שכבר בעמוד ──

/** הופך HTML לטקסט נקי (להזרקה לפרומפט). מוריד תגיות ומכווץ רווחים. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface AiContext {
  baseName: string;
  baseText: string;
  resultName: string;
  resultText: string;
}

/** מרכיב את הקונטקסט להזרקה מתוך הקריאה + התוכן הסטטי שכבר בעמוד. */
export function buildAiContext(reading: Reading, content: IChingContent): AiContext {
  const base = findHexText(content.hexagrams, reading.primary.number);
  const result = reading.resulting
    ? findHexText(content.hexagrams, reading.resulting.number)
    : undefined;
  return {
    baseName: effectiveHexName(reading.primary.number, content.hexagrams),
    baseText: htmlToPlainText(base?.interpretation ?? ""),
    resultName: reading.resulting
      ? effectiveHexName(reading.resulting.number, content.hexagrams)
      : "",
    resultText: htmlToPlainText(result?.interpretation ?? ""),
  };
}
