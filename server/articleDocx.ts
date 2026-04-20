import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  SectionType,
  convertInchesToTwip,
} from "docx";

/** Detect whether text is predominantly Hebrew/Arabic (RTL) */
function detectRTL(text: string): boolean {
  const rtlChars = (text.match(/[\u0590-\u05FF\u0600-\u06FF]/g) || []).length;
  const ltrChars = (text.match(/[a-zA-Z]/g) || []).length;
  return rtlChars > ltrChars;
}

/** Strip HTML tags and decode common HTML entities */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Fetch image from URL and return as Buffer */
async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/** Detect image type from URL or buffer magic bytes */
function detectImageType(
  url: string,
  buffer: Buffer
): "png" | "jpg" | "gif" | "bmp" {
  const lower = url.toLowerCase();
  if (lower.includes(".png")) return "png";
  if (lower.includes(".gif")) return "gif";
  if (lower.includes(".bmp")) return "bmp";
  // Check magic bytes for PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "png";
  return "jpg";
}

interface ArticleDocxOptions {
  title: string;
  excerpt?: string | null;
  body: string;
  coverImageUrl?: string | null;
  categoryName?: string | null;
  publishedDate?: Date | null;
}

export async function generateArticleDocx(
  options: ArticleDocxOptions
): Promise<Buffer> {
  const { title, excerpt, body, coverImageUrl, categoryName, publishedDate } =
    options;

  const plainBody = stripHtml(body);
  const allText = `${title} ${excerpt ?? ""} ${plainBody}`;
  const isRTL = detectRTL(allText);

  const bidi = isRTL;
  const alignment = isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT;

  const children: Paragraph[] = [];

  // ── Cover image ──────────────────────────────────────────────────────────
  if (coverImageUrl) {
    const imgBuffer = await fetchImage(coverImageUrl);
    if (imgBuffer) {
      const imgType = detectImageType(coverImageUrl, imgBuffer);
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: convertInchesToTwip(0.2) },
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: { width: 500, height: 300 },
              type: imgType,
            }),
          ],
        })
      );
    }
  }

  // ── Category + date line ─────────────────────────────────────────────────
  if (categoryName || publishedDate) {
    const metaParts: string[] = [];
    if (categoryName) metaParts.push(categoryName);
    if (publishedDate) {
      metaParts.push(
        publishedDate.toLocaleDateString(isRTL ? "he-IL" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: convertInchesToTwip(0.1) },
        children: [
          new TextRun({
            text: metaParts.join(" · "),
            color: "888888",
            size: 20,
            italics: true,
          }),
        ],
      })
    );
  }

  // ── Title ────────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      bidirectional: bidi,
      spacing: { after: convertInchesToTwip(0.15) },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 52,
          color: "1a1a1a",
          rightToLeft: bidi,
        }),
      ],
    })
  );

  // ── Divider ──────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: convertInchesToTwip(0.2) },
      children: [
        new TextRun({
          text: "─────────────────────────────",
          color: "cccccc",
          size: 20,
        }),
      ],
    })
  );

  // ── Excerpt ──────────────────────────────────────────────────────────────
  if (excerpt && excerpt.trim()) {
    children.push(
      new Paragraph({
        alignment,
        bidirectional: bidi,
        spacing: { after: convertInchesToTwip(0.25) },
        children: [
          new TextRun({
            text: stripHtml(excerpt),
            italics: true,
            size: 26,
            color: "555555",
            rightToLeft: bidi,
          }),
        ],
      })
    );
  }

  // ── Body ─────────────────────────────────────────────────────────────────
  const bodyLines = plainBody.split("\n");
  for (const line of bodyLines) {
    const trimmed = line.trim();
    children.push(
      new Paragraph({
        alignment,
        bidirectional: bidi,
        spacing: { after: convertInchesToTwip(0.1) },
        children: [
          new TextRun({
            text: trimmed || "",
            size: 24,
            color: "222222",
            rightToLeft: bidi,
          }),
        ],
      })
    );
  }

  // ── Build document ───────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1.2),
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
