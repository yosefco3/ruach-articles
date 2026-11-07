import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findCommerceSignals } from "../scripts/commerce-guard";
import { COMMERCE_CHECKLIST, COMMERCE_LEGAL_READY } from "../shared/commerceReadiness";

function tmpProject(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "commerce-guard-"));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  return dir;
}

describe("findCommerceSignals", () => {
  it("detects an SDK and a checkout route", () => {
    const dir = tmpProject({
      "package.json": JSON.stringify({ dependencies: { stripe: "^1.0.0" } }),
      "server/x.ts": 'app.post("/checkout", handler);\n',
    });
    const hits = findCommerceSignals(dir);
    expect(hits).toHaveLength(2);
    expect(hits.join("\n")).toContain("package.json: stripe");
    expect(hits.join("\n")).toContain("server/x.ts:1");
  });
  it("is quiet on clean files", () => {
    const dir = tmpProject({
      "package.json": JSON.stringify({ dependencies: { react: "1" } }),
      "server/x.ts": 'const purchaseLinks = "purchase"; app.get("/api/books", h);\n',
    });
    expect(findCommerceSignals(dir)).toEqual([]);
  });
});

describe("commerce tripwire (real repo)", () => {
  it("finds no payment code while COMMERCE_LEGAL_READY is false", () => {
    const hits = findCommerceSignals(path.resolve(import.meta.dirname, ".."));
    if (COMMERCE_LEGAL_READY) return;
    const message =
      "Payment code found but COMMERCE_LEGAL_READY is false (shared/commerceReadiness.ts). לפני שגובים כסף עברו על הרשימה:\n" +
      COMMERCE_CHECKLIST.map((i) => `- ${i.title}`).join("\n") +
      "\nHits:\n" +
      hits.join("\n");
    expect(hits, message).toEqual([]);
  });
});
