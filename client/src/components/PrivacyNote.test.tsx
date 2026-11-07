import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { PrivacyNote } from "./PrivacyNote";

describe("PrivacyNote", () => {
  it("renders the text, a link to /privacy and the className", () => {
    const html = renderToString(<Router ssrPath="/"><PrivacyNote className="mt-4">הטקסט</PrivacyNote></Router>);
    expect(html).toContain("הטקסט");
    expect(html).toContain('href="/privacy"');
    expect(html).toContain("מדיניות הפרטיות");
    expect(html).toContain("mt-4");
  });
});
