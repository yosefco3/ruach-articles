import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { F } from "./MyTeacherProfile";

/** כל שדה שעובר דרך F חייב להיות מקושר ל-label: <label for=X> + הרכיב עם id=X. */
function labelTargetId(html: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = html.match(new RegExp(`<label[^>]*for="([^"]+)"[^>]*>${escaped}</label>`));
  if (!m) throw new Error(`label "${label}" not found in: ${html}`);
  return m[1];
}

describe("MyTeacherProfile F (field label association)", () => {
  it("links the label to an Input via for/id", () => {
    const html = renderToString(
      <F label="שורת תיאור">
        <Input value="" onChange={() => {}} />
      </F>,
    );
    const id = labelTargetId(html, "שורת תיאור");
    expect(id).not.toBe("");
    expect(html).toContain(`<input`);
    expect(html).toContain(`id="${id}"`);
  });

  it("links the label to a Textarea via for/id", () => {
    const html = renderToString(
      <F label="ציטוט (משפט אחד)">
        <Textarea rows={2} value="" onChange={() => {}} />
      </F>,
    );
    const id = labelTargetId(html, "ציטוט (משפט אחד)");
    expect(html).toContain(`<textarea`);
    expect(html).toContain(`id="${id}"`);
  });

  it("gives each field its own id", () => {
    const html = renderToString(
      <>
        <F label="אתר אישי">
          <Input value="" onChange={() => {}} />
        </F>
        <F label="טלפון (אם תרצה שיוצג)">
          <Input value="" onChange={() => {}} />
        </F>
      </>,
    );
    const ids = Array.from(html.matchAll(/<input[^>]*\sid="([^"]+)"/g), (m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
