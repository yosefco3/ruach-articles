import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import ArticleAttachments, { formatAttachmentSize, isAudioAttachment } from "./ArticleAttachments";

const mp3 = { id: 1, fileName: "gate-of-death-guided-meditation.mp3", fileUrl: "https://cdn.example/attachments/abc.mp3", fileSize: 19_245_078 };
const pdf = { id: 2, fileName: "notes.pdf", fileUrl: "https://cdn.example/attachments/def.pdf", fileSize: 830 * 1024 };

describe("isAudioAttachment", () => {
  it("recognises audio by file name or by url extension", () => {
    expect(isAudioAttachment(mp3)).toBe(true);
    expect(isAudioAttachment({ fileName: "מדיטציה", fileUrl: "/uploads/attachments/x.m4a" })).toBe(true);
    expect(isAudioAttachment(pdf)).toBe(false);
  });
});

describe("formatAttachmentSize", () => {
  it("switches to MB above a megabyte", () => {
    expect(formatAttachmentSize(mp3.fileSize)).toBe("18.4 MB");
    expect(formatAttachmentSize(pdf.fileSize)).toBe("830.0 KB");
  });
});

describe("ArticleAttachments", () => {
  it("renders an inline player (no preload) plus a download link for audio, a card for the rest", () => {
    const html = renderToString(<ArticleAttachments attachments={[mp3, pdf]} />);
    expect(html).toContain("<audio");
    expect(html).toContain('preload="none"');
    expect(html).toContain(`src="${mp3.fileUrl}"`);
    expect(html).toContain("הורדה (18.4 MB)");
    expect(html).toContain("notes.pdf");
    expect(html).toContain("830.0 KB");
    // the pdf gets a download card, not a player
    expect(html.match(/<audio/g)?.length).toBe(1);
  });

  it("renders nothing without attachments", () => {
    expect(renderToString(<ArticleAttachments attachments={[]} />)).toBe("");
  });
});
