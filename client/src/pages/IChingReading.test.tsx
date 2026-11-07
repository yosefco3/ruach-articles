import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { cast } from "@shared/iching";
import type { IChingContent } from "@/pages/iching/model";
import IChingReading, { ResultView, TrigramChips } from "./IChingReading";
import { DEFAULT_SEL } from "@/pages/iching/model";

const content: IChingContent = {
  hexagrams: [],
  trigrams: [],
  intro: {
    articleHtml: "<p>מבוא</p>",
    questionPrompt: "מה השאלה שלך?",
    questionHint: "השאלה לא נשמרת",
    buttonLabel: "הטל",
    refineEnabled: false,
    aiEnabled: false,
  },
  aiMonthlyLimit: 5,
};

function withProviders(node: React.ReactNode) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(getQueryKey(trpc.iching.getContent, undefined, "query"), content);
  const client = trpc.createClient({
    links: [httpBatchLink({ url: "http://localhost:0/api/trpc", transformer: superjson })],
  });
  return renderToString(
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>
    </trpc.Provider>,
  );
}

function buttons(html: string): string[] {
  return html.match(/<button\b[^>]*>/g) ?? [];
}

describe("IChingReading accessibility", () => {
  it("question textarea is reachable by its label (label for = textarea id)", () => {
    const html = withProviders(<IChingReading />);
    const labelFor = /<label[^>]*\sfor="([^"]+)"/.exec(html)?.[1];
    const textareaId = /<textarea[^>]*\sid="([^"]+)"/.exec(html)?.[1];
    expect(labelFor).toBeTruthy();
    expect(textareaId).toBe(labelFor);
    expect(html).toContain("מה השאלה שלך?");
  });

  it("trigram chips are real buttons with a Hebrew name and pressed state", () => {
    const html = withProviders(
      <TrigramChips values={[0, 7]} trigrams={[]} selTri={0} onSelect={() => {}} />,
    );
    const bs = buttons(html);
    expect(bs).toHaveLength(2);
    for (const b of bs) {
      expect(b).toContain('type="button"');
      expect(b).toContain('aria-label="טריגרמה ');
    }
    expect(bs[0]).toContain('aria-pressed="true"');
    expect(bs[1]).toContain('aria-pressed="false"');
  });

  it("result: hexagram selectors are buttons, and the result heading is focusable", () => {
    // קריאה עם קווים משתנים, כדי ששתי ההקסגרמות יוצגו
    let reading = cast();
    for (let i = 0; i < 200 && reading.changing.length === 0; i++) reading = cast();
    expect(reading.changing.length).toBeGreaterThan(0);
    const html = withProviders(
      <ResultView
        reading={reading}
        qSaved=""
        content={content}
        sel={DEFAULT_SEL}
        setSel={() => {}}
        onReset={() => {}}
        headingRef={{ current: null }}
      />,
    );
    const hexButtons = buttons(html).filter((b) => b.includes("aria-label=\"הקסגרמה "));
    expect(hexButtons).toHaveLength(2);
    expect(hexButtons[0]).toContain('aria-pressed="true"');
    expect(hexButtons[1]).toContain('aria-pressed="false"');
    expect(html).toMatch(/<h2[^>]*tabindex="-1"[^>]*>\s*תוצאת הקריאה/);
    // בלי תוכן קליקבילי שאינו כפתור
    expect(html).not.toMatch(/<div[^>]*role="button"/);
  });
});
