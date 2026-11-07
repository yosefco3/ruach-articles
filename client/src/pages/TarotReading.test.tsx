import { Router } from "wouter";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import type { TarotContent } from "@/pages/tarot/model";
import TarotReading from "./TarotReading";

const content: TarotContent = {
  cards: [],
  intro: {
    articleHtml: "<p>מבוא</p>",
    questionPrompt: "מה תרצה לשאול?",
    questionHint: "השאלה לא נשמרת",
    buttonLabel: "שלוף",
    aiEnabled: false,
  },
  aiMonthlyLimit: 5,
};

describe("TarotReading accessibility", () => {
  it("question textarea is reachable by its label (label for = textarea id)", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(getQueryKey(trpc.tarot.getContent, undefined, "query"), content);
    const client = trpc.createClient({
      links: [httpBatchLink({ url: "http://localhost:0/api/trpc", transformer: superjson })],
    });
    const html = renderToString(
      <Router ssrPath="/"><trpc.Provider client={client} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <TarotReading />
        </QueryClientProvider>
      </trpc.Provider></Router>,
    );
    const labelFor = /<label[^>]*\sfor="([^"]+)"/.exec(html)?.[1];
    const textareaId = /<textarea[^>]*\sid="([^"]+)"/.exec(html)?.[1];
    expect(labelFor).toBeTruthy();
    expect(textareaId).toBe(labelFor);
    expect(html).toContain("מה תרצה לשאול?");
  });
});
