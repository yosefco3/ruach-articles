import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

// העבודה "בהמתנה" — בלי רשת. בודקים שאזור ההכרזה מציג את טקסט הטעינה.
vi.mock("./useTarotJob", () => ({
  useTarotJob: () => ({ run: () => {}, pending: true, result: null, error: null, failures: 0, reset: () => {} }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ client: {}, tarot: { myUsage: { invalidate: () => {} } } }),
    tarot: { myUsage: { useQuery: () => ({ data: undefined }) } },
  },
}));

import { TarotAiPanel } from "./TarotAiPanel";

describe("TarotAiPanel live region", () => {
  it("shows the loading text in a polite status region while the job is pending", () => {
    const html = renderToString(
      <TarotAiPanel question="?" cards={[]} isAuthenticated monthlyLimit={5} />,
    );
    const m = /<p[^>]*role="status"[^>]*>([^<]*)<\/p>/.exec(html);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("הפירוש בהכנה…");
    expect(html).toContain('aria-live="polite"');
  });
});
