import { describe, expect, it } from "vitest";
import { extractLastJsonObject } from "./json";

const parse = (text: string) => {
  const json = extractLastJsonObject(text);
  return json === null ? null : JSON.parse(json);
};

describe("extractLastJsonObject", () => {
  it("returns a bare object as is", () => {
    expect(parse('{"kind":"three","options":[]}')).toEqual({ kind: "three", options: [] });
  });

  it("strips a code fence and surrounding prose", () => {
    expect(parse('הנה התשובה:\n```json\n{"kind": "choice", "options": ["א", "ב"]}\n```\nבהצלחה')).toEqual({
      kind: "choice",
      options: ["א", "ב"],
    });
  });

  it("takes the LAST object when the text holds earlier drafts (reasoning channel)", () => {
    const reasoning =
      'Maybe {"kind":"three","options":[]} ... no, explicit options. ' +
      'Final: {"kind":"choice","options":["לפרסם עכשיו","לחכות"],"title":"תזמון הפרסום"}';
    expect(parse(reasoning)).toEqual({
      kind: "choice",
      options: ["לפרסם עכשיו", "לחכות"],
      title: "תזמון הפרסום",
    });
  });

  it("returns the outermost object, not a nested one", () => {
    expect(parse('x {"a": {"b": 1}, "c": [ {"d": 2} ]} y')).toEqual({ a: { b: 1 }, c: [{ d: 2 }] });
  });

  it("skips a trailing broken object and falls back to the last valid one", () => {
    expect(parse('{"ok": true} and then {"broken": }')).toEqual({ ok: true });
  });

  it("handles braces inside string values", () => {
    expect(parse('{"title": "סוגר } בתוך מחרוזת", "n": 1}')).toEqual({ title: "סוגר } בתוך מחרוזת", n: 1 });
  });

  it("ignores arrays and scalars — only an object counts", () => {
    expect(extractLastJsonObject('["a", "b"]')).toBeNull();
    expect(extractLastJsonObject("42")).toBeNull();
  });

  it("returns null when there is no JSON at all", () => {
    expect(extractLastJsonObject("")).toBeNull();
    expect(extractLastJsonObject("לא JSON בכלל")).toBeNull();
    expect(extractLastJsonObject("{ not json }")).toBeNull();
    expect(extractLastJsonObject("} {")).toBeNull();
  });

  it("gives up on pathological input instead of hanging", () => {
    const t0 = Date.now();
    expect(extractLastJsonObject("{".repeat(2000) + "}".repeat(2000))).toBeNull();
    expect(Date.now() - t0).toBeLessThan(500);
  });
});
