import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { IChingAiPanel } from "./IChingAiPanel";

type Usage = { used: number; limit: number; remaining: number; unlimited: boolean };

/** עטיפת providers מינימלית — הרינדור סטטי, אף בקשה לא נשלחת בפועל. */
function renderPanel(props: Partial<Parameters<typeof IChingAiPanel>[0]> = {}, usage?: Usage) {
  const queryClient = new QueryClient();
  if (usage) {
    queryClient.setQueryData(getQueryKey(trpc.iching.myUsage, undefined, "query"), usage);
  }
  const client = trpc.createClient({
    links: [httpBatchLink({ url: "http://localhost:0/api/trpc", transformer: superjson })],
  });
  return renderToString(
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <IChingAiPanel
          question="מה נכון להבין?"
          context={{
            baseName: "1 · הבורא",
            baseText: "פירוש",
            resultName: "",
            resultText: "",
            changingLines: [],
          }}
          isAuthenticated={false}
          monthlyLimit={5}
          {...props}
        />
      </QueryClientProvider>
    </trpc.Provider>,
  );
}

describe("IChingAiPanel (static render)", () => {
  it("guest: blocked with a login invite carrying the server-configured limit", () => {
    const html = renderPanel({ isAuthenticated: false, monthlyLimit: 7 });
    expect(html).toContain("התחבר עם גוגל");
    expect(html).toContain("7");
    expect(html).not.toContain("קבל פירוש AI מותאם אישית");
  });

  it("authenticated with remaining quota: shows the remaining-readings counter", () => {
    const html = renderPanel(
      { isAuthenticated: true },
      { used: 1, limit: 5, remaining: 4, unlimited: false },
    );
    expect(html).toContain("נותרו לך 4 קריאות AI חינמיות החודש");
    expect(html).toContain("קבל פירוש AI מותאם אישית");
  });

  it("quota exhausted: shows the exhausted message and a disabled button", () => {
    const html = renderPanel(
      { isAuthenticated: true },
      { used: 5, limit: 5, remaining: 0, unlimited: false },
    );
    expect(html).toContain("ניצלת את");
    expect(html).toContain("הקריאות החינמיות שלך לחודש זה");
    expect(html).toMatch(/<button[^>]*disabled/);
    expect(html).not.toContain("נותרו לך");
  });

  it("admin (unlimited): no counter, active button", () => {
    const html = renderPanel(
      { isAuthenticated: true },
      { used: 0, limit: 5, remaining: 5, unlimited: true },
    );
    expect(html).not.toContain("נותרו לך");
    expect(html).not.toContain("ניצלת את");
    expect(html).not.toMatch(/<button[^>]*disabled/);
  });
});
