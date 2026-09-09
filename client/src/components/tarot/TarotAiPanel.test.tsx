import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { TarotAiPanel } from "./TarotAiPanel";

/** עטיפת providers מינימלית — הרינדור סטטי, אף בקשה לא נשלחת בפועל. */
function renderPanel(props: Partial<Parameters<typeof TarotAiPanel>[0]> = {}) {
  const queryClient = new QueryClient();
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
});
