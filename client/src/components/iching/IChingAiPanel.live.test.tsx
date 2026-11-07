import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

// הפירוש "בהמתנה" — בלי רשת. בודקים שאזור ההכרזה מציג את טקסט הטעינה.
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ iching: { myUsage: { invalidate: () => {} } } }),
    iching: {
      myUsage: { useQuery: () => ({ data: undefined }) },
      interpret: { useMutation: () => ({ isPending: true, data: undefined, error: null, mutate: () => {} }) },
    },
  },
}));

import { IChingAiPanel } from "./IChingAiPanel";

describe("IChingAiPanel live region", () => {
  it("shows the loading text in a polite status region while the mutation is pending", () => {
    const html = renderToString(
      <IChingAiPanel
        question="?"
        context={{ baseName: "", baseText: "", resultName: "", resultText: "", changingLines: [] } as never}
        isAuthenticated
        monthlyLimit={5}
      />,
    );
    const m = /<p[^>]*role="status"[^>]*>([^<]*)<\/p>/.exec(html);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("הפירוש בהכנה…");
  });
});
