import { describe, expect, it } from "vitest";
import {
  COMMERCE_CHECKLIST,
  COMMERCE_TRIGGER_LABELS,
  checklistFor,
  isPaidPrice,
  type CommerceTrigger,
} from "./commerceReadiness";

describe("commerce checklist", () => {
  it("has unique ids", () => {
    const ids = COMMERCE_CHECKLIST.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("covers every trigger", () => {
    for (const t of Object.keys(COMMERCE_TRIGGER_LABELS) as CommerceTrigger[]) {
      expect(checklistFor(t).length, t).toBeGreaterThanOrEqual(1);
    }
  });
  it("every item applies to something", () => {
    for (const i of COMMERCE_CHECKLIST) expect(i.appliesTo.length, i.id).toBeGreaterThan(0);
  });
});

describe("isPaidPrice", () => {
  it.each(["", "  ", "חינם", "ללא עלות", "free", "0", "0 ₪", "0.00"])("%j is free", (p) => {
    expect(isPaidPrice(p)).toBe(false);
  });
  it.each(["120 ₪", "₪50", '50 ש"ח', "תרומה"])("%j is paid", (p) => {
    expect(isPaidPrice(p)).toBe(true);
  });
});
