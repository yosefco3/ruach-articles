import { describe, expect, it } from "vitest";
import { DEFAULT_QUESTION_HINT, LEGACY_QUESTION_HINT, normalizeQuestionHint } from "./questionHint";

describe("normalizeQuestionHint", () => {
  it("maps the exact legacy text to the new default", () => {
    expect(normalizeQuestionHint({ id: 1, questionHint: LEGACY_QUESTION_HINT }).questionHint).toBe(DEFAULT_QUESTION_HINT);
  });
  it("leaves admin-written text untouched", () => {
    const row = { questionHint: "טקסט מותאם" };
    expect(normalizeQuestionHint(row)).toBe(row);
  });
});
