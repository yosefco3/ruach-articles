import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { renderMdLite } from "./mdLite";

const render = (text: string) =>
  renderToString(<Router ssrPath="/derech">{renderMdLite(text)}</Router>);

describe("renderMdLite", () => {
  it("passes plain text through unchanged", () => {
    expect(render("שלום עולם")).toContain("שלום עולם");
  });

  it("renders **bold** as <strong>", () => {
    expect(render("א **מודגש** ב")).toContain("<strong>מודגש</strong>");
  });

  it("renders internal links as anchors with the primary style", () => {
    const html = render("ראו [נשימת 8](/article/ielgyrqpya) כאן");
    expect(html).toContain('href="/article/ielgyrqpya"');
    expect(html).toContain("נשימת 8");
  });

  it("renders external links with target=_blank", () => {
    const html = render("[אתר](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
  });

  it("does not interpret HTML in the text (XSS-safe)", () => {
    const html = render('<script>alert("x")</script>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("handles multiple mixed tokens in one string", () => {
    const html = render("**א** ואז [ב](/x) ואז **ג**");
    expect(html).toContain("<strong>א</strong>");
    expect(html).toContain('href="/x"');
    expect(html).toContain("<strong>ג</strong>");
  });
});
