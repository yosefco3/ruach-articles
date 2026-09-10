/**
 * הדפסת פריסה — טארוט ואי-צ'ינג. בוני ה-HTML טהורים (ניתנים לבדיקה ב-node);
 * `printHtmlDocument` מזריק את המסמך ל-iframe נסתר, ממתין לתמונות ומדפיס.
 * מה מודפס: השאלה + הקלפים/ההקסגרמות תמיד; פירוש ה-AI רק אם התקבל בפועל.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FONTS_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700;900&family=Heebo:wght@400;500;700&display=swap" rel="stylesheet" />';

const BASE_CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 28px 32px; direction: rtl;
    font-family: 'Heebo', sans-serif; color: #2b241c; line-height: 1.8;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .site { text-align: center; font-family: 'Frank Ruhl Libre', serif; font-weight: 900; font-size: 26px; color: #6b4f2a; }
  .tag { text-align: center; font-size: 12px; letter-spacing: 0.26em; color: #8a7a62; margin-top: 2px; }
  .rule { height: 2px; width: 120px; margin: 14px auto 22px; background: linear-gradient(to left, transparent, #c9a35c, transparent); }
  h1 { font-family: 'Frank Ruhl Libre', serif; font-weight: 900; font-size: 30px; text-align: center; margin: 0 0 6px; }
  .q-label { text-align: center; font-size: 11px; letter-spacing: 0.2em; color: #8a7a62; margin: 18px 0 6px; }
  .q { text-align: center; font-family: 'Frank Ruhl Libre', serif; font-style: italic; font-size: 19px; margin: 0 0 26px; }
  .spread { display: flex; justify-content: center; align-items: flex-start; gap: 26px; flex-wrap: wrap; margin: 10px 0 8px; }
  .slot { text-align: center; width: 150px; }
  .slot .pos { font-size: 10px; letter-spacing: 0.22em; color: #8a7a62; margin-bottom: 8px; }
  .slot img { width: 100%; border-radius: 8px; border: 1px solid #d8c9ab; }
  .slot .nm { font-family: 'Frank Ruhl Libre', serif; font-weight: 900; font-size: 16px; margin-top: 8px; }
  .slot .sb { font-size: 11.5px; color: #8a7a62; margin-top: 1px; }
  .hexes { display: flex; justify-content: center; align-items: flex-start; gap: 44px; margin: 18px 0 6px; }
  .hexcol { text-align: center; }
  .hexcol .pos { font-size: 10px; letter-spacing: 0.22em; color: #8a7a62; margin-bottom: 12px; }
  .hex { display: inline-flex; flex-direction: column; gap: 9px; }
  .ln { position: relative; width: 132px; height: 15px; }
  .ln .bar { position: absolute; top: 0; height: 100%; border-radius: 3px; background: #4a3b26; }
  .ln.yang .bar { right: 0; left: 0; }
  .ln.yin .bar.r { right: 0; width: calc(50% - 11px); }
  .ln.yin .bar.l { left: 0; width: calc(50% - 11px); }
  .ln .chg { position: absolute; right: 50%; top: 50%; transform: translate(50%, -50%);
    width: 9px; height: 9px; border-radius: 50%; border: 2px solid #b0642f; background: #fff; }
  .hexcol .nm { font-family: 'Frank Ruhl Libre', serif; font-weight: 900; font-size: 18px; margin-top: 12px; }
  .hexcol .sb { font-size: 12px; color: #8a7a62; margin-top: 1px; }
  .arrow { font-size: 26px; color: #b78a45; align-self: center; padding-top: 34px; }
  .chg-label { text-align: center; font-size: 12.5px; color: #7a5b3a; margin-top: 14px; }
  .ai { margin-top: 30px; border-top: 1px solid #d8c9ab; padding-top: 20px; page-break-inside: auto; }
  .ai h2 { font-family: 'Frank Ruhl Libre', serif; font-weight: 900; font-size: 20px; margin: 0 0 4px; }
  .ai .badge { font-size: 10.5px; color: #7a5b3a; margin-bottom: 14px; }
  .ai .body { font-size: 14.5px; line-height: 1.9; }
  .foot { margin-top: 34px; text-align: center; font-size: 11px; color: #a0917a; border-top: 1px solid #e5dac2; padding-top: 12px; }
  @page { margin: 12mm; }
`;

function docShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
${FONTS_LINK}
<style>${BASE_CSS}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function headerHtml(pageTitle: string, question: string): string {
  const q = question.trim()
    ? `<div class="q-label">הַשְּׁאֵלָה</div><div class="q">${escapeHtml(question.trim())}</div>`
    : "";
  return `<div class="site">רוּחַ</div>
<div class="tag">רוחניות · פילוסופיה · ריפוי</div>
<div class="rule"></div>
<h1>${escapeHtml(pageTitle)}</h1>${q}`;
}

/** תיבת פירוש ה-AI — מוזרקת רק כשיש פירוש בפועל. ה-HTML מגיע מ-marked (כמו בעמוד). */
function aiSectionHtml(aiHtml: string | null | undefined): string {
  if (!aiHtml || !aiHtml.trim()) return "";
  return `<div class="ai">
<h2>✨ פֵּרוּשׁ AI לַקְּרִיאָה</h2>
<div class="badge">נוצר על ידי בינה מלאכותית</div>
<div class="body">${aiHtml}</div>
</div>`;
}

function footerHtml(): string {
  const date = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  return `<div class="foot">הודפס מאתר רוח חכמה · ruachwisdom.org · ${escapeHtml(date)}</div>`;
}

// ── טארוט ──

export interface TarotPrintCard {
  name: string;
  suitLabel: string;
  imageUrl: string;
}

const TAROT_POSITIONS = ["קְלָף רִאשׁוֹן", "קְלָף שֵׁנִי", "קְלָף שְׁלִישִׁי"];

export function buildTarotPrintHtml(opts: {
  question: string;
  cards: TarotPrintCard[];
  aiHtml?: string | null;
}): string {
  const slots = opts.cards
    .map(
      (c, i) => `<div class="slot">
<div class="pos">${TAROT_POSITIONS[i] ?? `קְלָף ${i + 1}`}</div>
<img src="${escapeHtml(c.imageUrl)}" alt="${escapeHtml(c.name)}" />
<div class="nm">${escapeHtml(c.name)}</div>
<div class="sb">${escapeHtml(c.suitLabel)}</div>
</div>`,
    )
    .join("");
  const body = `${headerHtml("קְרִיאַת טָארוֹט", opts.question)}
<div class="spread">${slots}</div>
${aiSectionHtml(opts.aiHtml)}
${footerHtml()}`;
  return docShell("קריאת טארוט — רוח חכמה", body);
}

// ── אי-צ'ינג ──

export interface PrintHexLine {
  isYang: boolean;
  isChanging: boolean;
}

export interface PrintHexagram {
  name: string;
  number: number;
  lines: PrintHexLine[];
}

/** מצייר הקסגרמה ב-HTML: קו 6 למעלה, קו 1 למטה; yang = פס מלא, yin = שני פסים, משתנה = עיגול. */
export function hexagramHtml(lines: PrintHexLine[]): string {
  const rows: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const ln = lines[i];
    const bars = ln.isYang ? '<span class="bar"></span>' : '<span class="bar r"></span><span class="bar l"></span>';
    const chg = ln.isChanging ? '<span class="chg"></span>' : "";
    rows.push(`<div class="ln ${ln.isYang ? "yang" : "yin"}">${bars}${chg}</div>`);
  }
  return `<div class="hex">${rows.join("")}</div>`;
}

function hexColHtml(pos: string, hex: PrintHexagram): string {
  return `<div class="hexcol">
<div class="pos">${pos}</div>
${hexagramHtml(hex.lines)}
<div class="nm">${escapeHtml(hex.name)}</div>
<div class="sb">הקסגרמה ${hex.number}</div>
</div>`;
}

export function buildIchingPrintHtml(opts: {
  question: string;
  primary: PrintHexagram;
  derived?: PrintHexagram | null;
  changingLabel?: string | null;
  aiHtml?: string | null;
}): string {
  const cols = [hexColHtml("הַהֶקְסַגְרַמָה הָרָאשִׁית", opts.primary)];
  if (opts.derived) {
    cols.push('<div class="arrow">←</div>');
    cols.push(hexColHtml("הַהֶקְסַגְרַמָה הַנִּגְזֶרֶת", opts.derived));
  }
  const chg = opts.changingLabel?.trim()
    ? `<div class="chg-label">${escapeHtml(opts.changingLabel)}</div>`
    : "";
  const body = `${headerHtml("קְרִיאַת אִי צִ׳ינְג", opts.question)}
<div class="hexes">${cols.join("")}</div>
${chg}
${aiSectionHtml(opts.aiHtml)}
${footerHtml()}`;
  return docShell("קריאת אי צ׳ינג — רוח חכמה", body);
}

// ── ההדפסה עצמה ──

/**
 * מדפיס מסמך HTML דרך iframe נסתר: כותב, ממתין לתמונות ולפונטים (עד 4 שניות),
 * קורא ל-print ומנקה. לא נפתח חלון חדש — עמיד לחוסמי-פופאפים.
 */
export function printHtmlDocument(html: string): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } finally {
      // afterprint לא אמין בכל הדפדפנים — משאירים את ה-iframe לזמן דיאלוג נדיב ואז מנקים.
      win.addEventListener?.("afterprint", () => frame.remove());
      setTimeout(() => frame.remove(), 60_000);
    }
  };

  const waits: Promise<unknown>[] = Array.from(doc.images).map(
    (img) =>
      new Promise<void>((res) => {
        if (img.complete) return res();
        img.onload = () => res();
        img.onerror = () => res();
      }),
  );
  const fonts = (doc as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
  if (fonts) waits.push(fonts.catch(() => {}));

  const fallback = setTimeout(doPrint, 4000);
  Promise.all(waits).then(() => {
    clearTimeout(fallback);
    doPrint();
  });
}
