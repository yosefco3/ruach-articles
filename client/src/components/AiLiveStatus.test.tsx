import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { AiLiveStatus } from "./AiLiveStatus";

describe("AiLiveStatus", () => {
  it("is always in the DOM as a polite status region (empty when idle)", () => {
    const html = renderToString(<AiLiveStatus state="idle" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("sr-only");
  });

  it("announces loading, done and error", () => {
    expect(renderToString(<AiLiveStatus state="loading" />)).toContain("הפירוש בהכנה…");
    expect(renderToString(<AiLiveStatus state="done" />)).toContain("הפירוש מוכן");
    expect(renderToString(<AiLiveStatus state="error" errorText="תקלה" />)).toContain("תקלה");
  });
});
