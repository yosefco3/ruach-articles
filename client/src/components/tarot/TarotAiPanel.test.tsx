import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { TarotAiPanel } from "./TarotAiPanel";

type Usage = { used: number; limit: number; remaining: number; unlimited: boolean };

/** עטיפת providers מינימלית — הרינדור סטטי, אף בקשה לא נשלחת בפועל. */
function renderPanel(props: Partial<Parameters<typeof TarotAiPanel>[0]> = {}, usage?: Usage) {
  const queryClient = new QueryClient();
  if (usage) {
    queryClient.setQueryData(getQueryKey(trpc.tarot.myUsage, undefined, "query"), usage);
  }
  const client = trpc.createClient({
    links: [httpBatchLink({ url: "http://localhost:0/api/trpc", transformer: superjson })],
  });
  return renderToString(
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TarotAiPanel
          question="מה נכון להבין?"
          cards={[
            { name: "השוטה", summary: "התחלה", text: "פירוש" },
            { name: "המגדל", summary: "טלטלה", text: "פירוש" },
            { name: "הכוכב", summary: "תקווה", text: "פירוש" },
          ]}
          isAuthenticated={false}
          monthlyLimit={5}
          {...props}
        />
      </QueryClientProvider>
    </trpc.Provider>,
  );
}

describe("TarotAiPanel (static render)", () => {
  it("guest: blocked with a login invite carrying the server-configured limit", () => {
    const html = renderPanel({ isAuthenticated: false, monthlyLimit: 7 });
    expect(html).toContain("התחבר עם גוגל");
    expect(html).toContain("7"); // המספר מהשרת, לא מקובע
    expect(html).not.toContain("קבל פירוש AI לפריסה כולה");
  });

  it("authenticated: shows the interpret button and the privacy note", () => {
    const html = renderPanel({ isAuthenticated: true });
    expect(html).toContain("קבל פירוש AI לפריסה כולה");
    expect(html).toContain("אינם נשמרים");
    expect(html).toContain("נוצר על ידי בינה מלאכותית");
  });

  it("authenticated with remaining quota: shows the remaining-readings counter", () => {
    const html = renderPanel(
      { isAuthenticated: true },
      { used: 2, limit: 5, remaining: 3, unlimited: false },
    );
    expect(html).toContain("נותרו לך 3 קריאות AI חינמיות החודש");
    expect(html).toContain("קבל פירוש AI לפריסה כולה");
  });

  it("authenticated with a single remaining reading: singular phrasing", () => {
    const html = renderPanel(
      { isAuthenticated: true },
      { used: 4, limit: 5, remaining: 1, unlimited: false },
    );
    expect(html).toContain("נותרה לך קריאת AI חינמית אחת החודש");
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
    expect(html).toContain("קבל פירוש AI לפריסה כולה");
    expect(html).not.toMatch(/<button[^>]*disabled/);
  });

  it("choice spread: renders with six cards and the spread prop without blowing up", () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ name: `קלף ${i}`, summary: "", text: "" }));
    const html = renderPanel({
      isAuthenticated: true,
      cards: six,
      spread: { kind: "choice", options: ["לעבור", "להישאר"] },
    });
    expect(html).toContain("קבל פירוש AI לפריסה כולה");
  });
});
