/** בדיקות לבוני מסמך ההדפסה — טהורים, רצים ב-node בלי DOM. */
import { describe, expect, it } from "vitest";
import {
  buildIchingPrintHtml,
  buildTarotPrintHtml,
  escapeHtml,
  hexagramHtml,
  type PrintHexLine,
} from "./printReading";

const CARDS = [
  { name: "הַשּׁוֹטֶה", suitLabel: "אַרְקָנָה גְּדוֹלָה", imageUrl: "/tarot-cards/major-00.webp?v=3" },
  { name: "שְׁנַיִם מָטוֹת", suitLabel: "מָטוֹת · אֵשׁ", imageUrl: "/tarot-cards/wands-02.webp?v=3" },
  { name: "הַכֹּהֶנֶת", suitLabel: "אַרְקָנָה גְּדוֹלָה", imageUrl: "/tarot-cards/major-02.webp?v=3" },
];

describe("escapeHtml", () => {
  it("מנטרל תגיות ותווים מיוחדים", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });
});

describe("buildTarotPrintHtml", () => {
  it("כולל את השאלה, שלוש התמונות והשמות", () => {
    const html = buildTarotPrintHtml({ question: "מה צפוי לי?", cards: CARDS });
    expect(html).toContain("מה צפוי לי?");
    for (const c of CARDS) {
      expect(html).toContain(c.imageUrl);
      expect(html).toContain(c.name);
    }
    expect(html).toContain('dir="rtl"');
  });

  it("בלי AI — אין תיבת פירוש AI; עם AI — יש", () => {
    const without = buildTarotPrintHtml({ question: "", cards: CARDS });
    expect(without).not.toContain("פֵּרוּשׁ AI");
    const withAi = buildTarotPrintHtml({
      question: "",
      cards: CARDS,
      aiHtml: "<p>הקלפים מצביעים על התחלה חדשה.</p>",
    });
    expect(withAi).toContain("פֵּרוּשׁ AI");
    expect(withAi).toContain("הקלפים מצביעים על התחלה חדשה.");
    expect(withAi).toContain("נוצר על ידי בינה מלאכותית");
  });

  it("שאלה ריקה — אין כותרת שאלה; שאלה עוינת — מנוטרלת", () => {
    const empty = buildTarotPrintHtml({ question: "   ", cards: CARDS });
    expect(empty).not.toContain("הַשְּׁאֵלָה");
    const hostile = buildTarotPrintHtml({ question: "<img onerror=x>", cards: CARDS });
    expect(hostile).not.toContain("<img onerror");
    expect(hostile).toContain("&lt;img onerror=x&gt;");
  });
});

const YANG: PrintHexLine = { isYang: true, isChanging: false };
const YIN: PrintHexLine = { isYang: false, isChanging: false };
const YANG_CHG: PrintHexLine = { isYang: true, isChanging: true };

describe("hexagramHtml", () => {
  it("שישה קווים: yang פס אחד, yin שני פסים, משתנה עם עיגול", () => {
    const html = hexagramHtml([YANG, YIN, YANG_CHG, YIN, YANG, YIN]);
    expect(html.match(/class="ln yang"/g)).toHaveLength(3);
    expect(html.match(/class="ln yin"/g)).toHaveLength(3);
    expect(html.match(/class="chg"/g)).toHaveLength(1);
  });

  it("הקו הראשון (התחתון) מרונדר אחרון — מלמטה למעלה", () => {
    const html = hexagramHtml([YIN, YANG, YANG, YANG, YANG, YANG]);
    const lastRow = html.lastIndexOf('<div class="ln');
    expect(html.slice(lastRow)).toContain("yin");
  });
});

describe("buildIchingPrintHtml", () => {
  const primary = { name: "הַיּוֹצֵר", number: 1, lines: [YANG, YANG, YANG_CHG, YANG, YANG, YANG] };
  const derived = { name: "הַמְּקַבֶּלֶת", number: 2, lines: [YIN, YIN, YIN, YIN, YIN, YIN] };

  it("קריאה יציבה: הקסגרמה ראשית בלבד, בלי נגזרת ובלי AI", () => {
    const html = buildIchingPrintHtml({ question: "האם לצאת לדרך?", primary });
    expect(html).toContain("הַיּוֹצֵר");
    expect(html).toContain("הקסגרמה 1");
    expect(html).toContain("האם לצאת לדרך?");
    expect(html).not.toContain("הַנִּגְזֶרֶת");
    expect(html).not.toContain("פֵּרוּשׁ AI");
  });

  it("עם קווים משתנים: נגזרת + חץ + תווית הקווים", () => {
    const html = buildIchingPrintHtml({
      question: "",
      primary,
      derived,
      changingLabel: "קווים משתנים: קו 3 — הקריאה נעה מ«הַיּוֹצֵר» אל «הַמְּקַבֶּלֶת».",
    });
    expect(html).toContain("הַנִּגְזֶרֶת");
    expect(html).toContain("הַמְּקַבֶּלֶת");
    expect(html).toContain("הקסגרמה 2");
    expect(html).toContain("קווים משתנים: קו 3");
    expect(html).toContain('class="arrow"');
  });

  it("עם פירוש AI — התיבה מוזרקת", () => {
    const html = buildIchingPrintHtml({
      question: "",
      primary,
      aiHtml: "<p>הדרך פתוחה.</p>",
    });
    expect(html).toContain("פֵּרוּשׁ AI");
    expect(html).toContain("הדרך פתוחה.");
  });
});
