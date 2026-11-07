import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { CommerceReminder } from "./CommerceReminder";
import { COMMERCE_TRIGGER_LABELS } from "@shared/commerceReadiness";

describe("CommerceReminder", () => {
  it("card shows heading and all trigger labels", () => {
    const html = renderToString(<CommerceReminder trigger="all" variant="card" />);
    expect(html).toContain("לפני שגובים כסף באתר");
    for (const label of Object.values(COMMERCE_TRIGGER_LABELS)) expect(html).toContain(label);
  });
  it("inline paid-event shows the lead", () => {
    const html = renderToString(<CommerceReminder trigger="paid-event" variant="inline" />);
    expect(html).toContain("לאירוע יש מחיר.");
    expect(html).toContain('role="note"');
  });
  it("renders nothing when legal is ready", async () => {
    vi.resetModules();
    vi.doMock("@shared/commerceReadiness", async (orig) => ({
      ...(await orig<typeof import("@shared/commerceReadiness")>()),
      COMMERCE_LEGAL_READY: true,
    }));
    const mod = await import("./CommerceReminder");
    expect(renderToString(<mod.CommerceReminder trigger="all" variant="card" />)).toBe("");
    expect(renderToString(<mod.CommerceReminder trigger="paid-event" variant="inline" />)).toBe("");
    vi.doUnmock("@shared/commerceReadiness");
  });
});
