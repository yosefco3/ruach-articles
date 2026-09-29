// @vitest-environment happy-dom
/**
 * בדיקה חיה של תיבת שאלת ההמשך: רכיב אמיתי מול לקוח tRPC שהקישור שלו מדומה.
 * השרת (אסימון, תקרה, מכסה) נבדק ב-server/routers/tarot.router.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, type TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { THREE_SPREAD, cardById, type TarotReading } from "@shared/tarot";
import { trpc } from "@/lib/trpc";
import { toCardViews, type FollowUpInput, type FollowUpTurn, type TarotContent } from "@/pages/tarot/model";
import type { AppRouter } from "../../../../server/routers";
import { POLL_MS } from "./useTarotJob";
import { TarotFollowUp } from "./TarotFollowUp";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SPREAD_IDS = ["major-00", "major-16", "major-17"];
const reading: TarotReading = {
  cards: SPREAD_IDS.map((id, position) => ({ card: cardById(id)!, position, orientation: "upright" as const })),
};
const content: TarotContent = {
  cards: [],
  intro: { articleHtml: "", questionPrompt: "", questionHint: "", buttonLabel: "", aiEnabled: true },
  aiMonthlyLimit: 5,
};
const views = toCardViews(reading, content);

type Handler = (path: string, input: unknown) => Promise<unknown>;

function serverError(message: string, code: string) {
  return new TRPCClientError<AppRouter>(message, {
    result: { error: { message, code: -32000, data: { code, httpStatus: 400, path: "tarot.followUp" } } } as never,
  });
}

let root: Root;
let container: HTMLElement;
let calls: { path: string; input: unknown }[];
let onTurnsChange: ReturnType<typeof vi.fn>;

function mount(handler: Handler, props: Partial<Parameters<typeof TarotFollowUp>[0]> = {}) {
  const link: TRPCLink<AppRouter> = () => ({ op }) =>
    observable((observer) => {
      calls.push({ path: op.path, input: op.input });
      handler(op.path, op.input).then(
        (data) => {
          observer.next({ result: { data } });
          observer.complete();
        },
        (err) => observer.error(err as TRPCClientError<AppRouter>),
      );
    });
  const queryClient = new QueryClient();
  const client = trpc.createClient({ links: [link] });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <trpc.Provider client={client} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <TarotFollowUp
            token="tok"
            initialLeft={2}
            question="מה נכון להבין?"
            views={views}
            spread={THREE_SPREAD}
            interpretation="**הפירוש שניתן**"
            reading={reading}
            content={content}
            onTurnsChange={onTurnsChange as (t: FollowUpTurn[]) => void}
            {...props}
          />
        </QueryClientProvider>
      </trpc.Provider>,
    );
  });
}

async function tick(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  for (let i = 0; i < 3; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
  }
}

const $ = (sel: string) => container.querySelector(sel);
const $$ = (sel: string) => Array.from(container.querySelectorAll(sel));
const askButton = () => $('[data-testid="followup-ask"]') as HTMLButtonElement | null;
const chips = () => $$('[data-testid="followup-chip"]') as HTMLButtonElement[];
const textarea = () => $("textarea") as HTMLTextAreaElement | null;
const click = (el: Element) => act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const buttonByText = (text: string) =>
  ($$("button") as HTMLButtonElement[]).find((b) => b.textContent?.includes(text));
const followUpCalls = () => calls.filter((c) => c.path === "tarot.followUp").map((c) => c.input as FollowUpInput);

/** שרת מדומה שעונה מיד: כל שאלה מקבלת jobId משלה, ותשובה שמורידה את המונה. */
function happyServer(): Handler {
  let asked = 0;
  return async (path) => {
    if (path === "tarot.followUp") return { jobId: `job-${++asked}` };
    if (path === "tarot.followUpResult") {
      return { status: "done", result: { answer: `**תשובה ${asked}**`, followUpsLeft: 2 - asked } };
    }
    throw new Error(`unexpected call: ${path}`);
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  calls = [];
  onTurnsChange = vi.fn();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("TarotFollowUp (live)", () => {
  it("opens with the suggestions, an empty field, a disabled button and the allowance", () => {
    mount(happyServer());
    expect(container.textContent).toContain("שְׁאֵלַת הֶמְשֵׁךְ");
    expect(chips()).toHaveLength(4);
    expect(textarea()!.value).toBe("");
    expect(askButton()!.disabled).toBe(true);
    expect(container.textContent).toContain("נותרו 2 שאלות המשך");
    expect(container.textContent).toContain("אינן נספרות במכסה החודשית");
    expect(container.textContent).toContain("אינם נשמרים");
    expect($('[data-testid="clarifier-card"]')).toBeNull();
    expect(calls).toEqual([]);
  });

  it("a suggestion only fills the field — nothing is sent and no card is drawn", async () => {
    mount(happyServer());
    const chip = chips()[0];
    const label = chip.textContent!;
    click(chip);
    await tick();
    expect(textarea()!.value).toBe(label);
    expect(askButton()!.disabled).toBe(false);
    expect($('[data-testid="clarifier-card"]')).toBeNull();
    expect(calls).toEqual([]);
  });

  it("uses the choice-spread suggestions for a choice spread", () => {
    mount(happyServer(), { spread: { kind: "choice", options: ["א", "ב"] } });
    expect(chips().map((c) => c.textContent)).toContain("מה יעזור לי להכריע?");
  });

  it("tailored suggestions override the static list only when there are at least two", () => {
    mount(happyServer(), { suggestions: ["שאלה מותאמת א?", "שאלה מותאמת ב?"] });
    expect(chips().map((c) => c.textContent)).toEqual(["שאלה מותאמת א?", "שאלה מותאמת ב?"]);
    act(() => root.unmount());
    container.remove();
    mount(happyServer(), { suggestions: ["רק אחת?"] });
    expect(chips()).toHaveLength(4);
  });

  it("asking draws a new card, sends the full context, and shows the answer", async () => {
    mount(happyServer(), { rng: () => 0.5 });
    click(chips()[1]);
    const asked = textarea()!.value;
    click(askButton()!);

    // הקלף נחשף מיד, עוד לפני שהתשובה הגיעה
    const card = $('[data-testid="clarifier-card"]')!;
    expect(card).not.toBeNull();
    expect(SPREAD_IDS).not.toContain(card.getAttribute("data-card-id"));
    expect(container.textContent).toContain("ה-AI קורא את הקלף המבהיר");

    await tick();
    await tick(POLL_MS);

    const [sent] = followUpCalls();
    expect(sent.readingToken).toBe("tok");
    expect(sent.question).toBe("מה נכון להבין?");
    expect(sent.interpretation).toBe("**הפירוש שניתן**");
    expect(sent.cards).toHaveLength(3);
    expect(sent.previous).toEqual([]);
    expect(sent.followUp.question).toBe(asked);

    expect($$('[data-testid="followup-turn"]')).toHaveLength(1);
    expect(container.innerHTML).toContain("<strong>תשובה 1</strong>");
    expect(container.textContent).toContain("נותרה שאלת המשך אחת");
    expect(textarea()!.value).toBe("");
    expect(onTurnsChange).toHaveBeenCalledOnce();
    expect(onTurnsChange.mock.calls[0][0]).toHaveLength(1);
  });

  it("the second follow-up carries the first turn, draws a different card, and drops the asked suggestion", async () => {
    mount(happyServer());
    const first = chips()[0].textContent!;
    click(chips()[0]);
    click(askButton()!);
    await tick();
    await tick(POLL_MS);

    expect(chips().map((c) => c.textContent)).not.toContain(first);
    expect(chips()).toHaveLength(3);

    click(chips()[0]);
    click(askButton()!);
    await tick();
    await tick(POLL_MS);

    const [, second] = followUpCalls();
    expect(second.previous).toHaveLength(1);
    expect(second.previous[0].question).toBe(first);
    expect(second.previous[0].answer).toBe("**תשובה 1**");

    const ids = $$('[data-testid="clarifier-card"]').map((c) => c.getAttribute("data-card-id"));
    expect(ids).toHaveLength(2);
    expect(new Set([...ids, ...SPREAD_IDS]).size).toBe(5);
  });

  it("after two follow-ups the field is replaced by the exhausted message", async () => {
    mount(happyServer());
    for (let i = 0; i < 2; i++) {
      click(chips()[0]);
      click(askButton()!);
      await tick();
      await tick(POLL_MS);
    }
    expect($$('[data-testid="followup-turn"]')).toHaveLength(2);
    expect(textarea()).toBeNull();
    expect(askButton()).toBeNull();
    expect(chips()).toHaveLength(0);
    expect(container.textContent).toContain("שאלת את שתי שאלות ההמשך של הקריאה הזו");
    expect(container.textContent).toContain("שליפה חדשה");
  });

  it("opens exhausted when the server reported no allowance", () => {
    mount(happyServer(), { initialLeft: 0 });
    expect(textarea()).toBeNull();
    expect(container.textContent).toContain("שאלות ההמשך של הקריאה הזו מוצו");
  });

  it("retrying after a failure resends the SAME card and question", async () => {
    let fail = true;
    mount(async (path) => {
      if (path === "tarot.followUp") {
        if (fail) throw serverError("boom", "INTERNAL_SERVER_ERROR");
        return { jobId: "job-1" };
      }
      return { status: "done", result: { answer: "תשובה", followUpsLeft: 1 } };
    });
    click(chips()[0]);
    click(askButton()!);
    await tick();

    expect(container.textContent).toContain("אירעה שגיאה בקבלת התשובה");
    expect(container.textContent).toContain("הקלף שנשלף נשמר");
    const drawn = $('[data-testid="clarifier-card"]')!.getAttribute("data-card-id");

    fail = false;
    click(buttonByText("נסה שוב")!);
    await tick();
    await tick(POLL_MS);

    const sent = followUpCalls();
    expect(sent).toHaveLength(2);
    expect(sent[1].followUp).toEqual(sent[0].followUp);
    expect($('[data-testid="clarifier-card"]')!.getAttribute("data-card-id")).toBe(drawn);
    expect($$('[data-testid="followup-turn"]')).toHaveLength(1);
  });

  it("an expired reading shows the message, with no retry and no field", async () => {
    mount(async () => {
      throw serverError("READING_EXPIRED", "FORBIDDEN");
    });
    click(chips()[0]);
    click(askButton()!);
    await tick();
    expect(container.textContent).toContain("הקריאה הזו כבר אינה פתוחה לשאלות המשך");
    expect(buttonByText("נסה שוב")).toBeUndefined();
    expect(textarea()).toBeNull();
  });

  it("the server's per-reading limit is shown as exhausted", async () => {
    mount(async () => {
      throw serverError("FOLLOWUP_LIMIT", "FORBIDDEN");
    });
    click(chips()[0]);
    click(askButton()!);
    await tick();
    expect(container.textContent).toContain("שאלות ההמשך של הקריאה הזו מוצו");
    expect(textarea()).toBeNull();
  });

  it("the hourly cap keeps the question and the card for a later retry", async () => {
    mount(async () => {
      throw serverError("FOLLOWUP_RATE_LIMITED", "TOO_MANY_REQUESTS");
    });
    click(chips()[0]);
    click(askButton()!);
    await tick();
    expect(container.textContent).toContain("שאלת הרבה שאלות בשעה האחרונה");
    expect($('[data-testid="clarifier-card"]')).not.toBeNull();
    expect(buttonByText("נסה שוב")).toBeDefined();
  });
});
