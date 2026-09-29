import { beforeEach, describe, expect, it } from "vitest";
import { MAX_FOLLOWUPS } from "@shared/tarot";
import {
  READING_TOKEN_TTL_MS,
  __resetFollowUps,
  followUpsLeft,
  issueReadingToken,
  releaseFollowUp,
  reserveFollowUp,
  verifyReadingToken,
} from "./tarotReadingToken";

const SECRET = "test-secret-at-least-16-chars";
const NOW = 1_800_000_000_000;

describe("reading token — issue & verify", () => {
  it("a freshly issued token verifies for its owner and yields the reading id", () => {
    const token = issueReadingToken(7, SECRET, NOW);
    const check = verifyReadingToken(token, 7, SECRET, NOW + 1000);
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.rid).toBe(token.split(".")[0]);
  });

  it("has four dot-separated parts and carries nothing but id, user and expiry", () => {
    const parts = issueReadingToken(7, SECRET, NOW).split(".");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(parts[1]).toBe("7");
    expect(parts[2]).toBe(String(NOW + READING_TOKEN_TTL_MS));
  });

  it("issues a different reading id every time", () => {
    const a = issueReadingToken(7, SECRET, NOW).split(".")[0];
    const b = issueReadingToken(7, SECRET, NOW).split(".")[0];
    expect(a).not.toBe(b);
  });

  it("rejects another user's token", () => {
    const token = issueReadingToken(7, SECRET, NOW);
    expect(verifyReadingToken(token, 8, SECRET, NOW)).toEqual({ ok: false, reason: "WRONG_USER" });
  });

  it("expires exactly at the end of the TTL", () => {
    const token = issueReadingToken(7, SECRET, NOW);
    expect(verifyReadingToken(token, 7, SECRET, NOW + READING_TOKEN_TTL_MS - 1).ok).toBe(true);
    expect(verifyReadingToken(token, 7, SECRET, NOW + READING_TOKEN_TTL_MS)).toEqual({
      ok: false,
      reason: "EXPIRED",
    });
  });

  it("rejects a token signed with a different secret", () => {
    const token = issueReadingToken(7, "another-secret-16-chars!", NOW);
    expect(verifyReadingToken(token, 7, SECRET, NOW)).toEqual({ ok: false, reason: "INVALID" });
  });

  it.each([0, 1, 2, 3])("rejects a token whose part %i was tampered with", (index) => {
    const parts = issueReadingToken(7, SECRET, NOW).split(".");
    const original = parts[index];
    // מחליפים את התו האחרון בתו אחר מאותו סוג, כך שהמבנה נשאר תקין ורק החתימה נשברת.
    const last = original.slice(-1);
    parts[index] = original.slice(0, -1) + (last === "1" ? "2" : "1");
    expect(verifyReadingToken(parts.join("."), 7, SECRET, NOW)).toEqual({ ok: false, reason: "INVALID" });
  });

  it("cannot be re-targeted to another user or extended by editing the payload", () => {
    const [rid, , exp, sig] = issueReadingToken(7, SECRET, NOW).split(".");
    expect(verifyReadingToken(`${rid}.8.${exp}.${sig}`, 8, SECRET, NOW).ok).toBe(false);
    const later = String(Number(exp) + READING_TOKEN_TTL_MS);
    expect(verifyReadingToken(`${rid}.7.${later}.${sig}`, 7, SECRET, NOW).ok).toBe(false);
  });

  it.each(["", "garbage", "a.b.c", "a.b.c.d.e", "...", "rid.7.123.", ".7.123.sig"])(
    "rejects malformed input %j",
    (token) => {
      expect(verifyReadingToken(token, 7, SECRET, NOW)).toEqual({ ok: false, reason: "INVALID" });
    },
  );

  it("rejects a non-string token without throwing", () => {
    expect(verifyReadingToken(undefined as unknown as string, 7, SECRET, NOW)).toEqual({
      ok: false,
      reason: "INVALID",
    });
  });
});

describe("reading token — follow-up counter", () => {
  beforeEach(() => __resetFollowUps());

  it("starts with the full allowance", () => {
    expect(followUpsLeft("r1", NOW)).toBe(MAX_FOLLOWUPS);
  });

  it("reserves up to MAX_FOLLOWUPS and then refuses", () => {
    for (let i = 0; i < MAX_FOLLOWUPS; i++) {
      expect(reserveFollowUp("r1", NOW)).toBe(true);
      expect(followUpsLeft("r1", NOW)).toBe(MAX_FOLLOWUPS - i - 1);
    }
    expect(reserveFollowUp("r1", NOW)).toBe(false);
    expect(followUpsLeft("r1", NOW)).toBe(0);
  });

  it("a released slot can be reserved again (count-on-success)", () => {
    for (let i = 0; i < MAX_FOLLOWUPS; i++) reserveFollowUp("r1", NOW);
    expect(reserveFollowUp("r1", NOW)).toBe(false);
    releaseFollowUp("r1");
    expect(followUpsLeft("r1", NOW)).toBe(1);
    expect(reserveFollowUp("r1", NOW)).toBe(true);
    expect(reserveFollowUp("r1", NOW)).toBe(false);
  });

  it("counts each reading separately", () => {
    for (let i = 0; i < MAX_FOLLOWUPS; i++) reserveFollowUp("r1", NOW);
    expect(reserveFollowUp("r2", NOW)).toBe(true);
    expect(followUpsLeft("r2", NOW)).toBe(MAX_FOLLOWUPS - 1);
  });

  it("releasing an unknown or untouched reading is a no-op", () => {
    releaseFollowUp("nope");
    expect(followUpsLeft("nope", NOW)).toBe(MAX_FOLLOWUPS);
    reserveFollowUp("r1", NOW);
    releaseFollowUp("r1");
    releaseFollowUp("r1");
    expect(followUpsLeft("r1", NOW)).toBe(MAX_FOLLOWUPS);
  });

  it("forgets a reading once its token can no longer be valid", () => {
    for (let i = 0; i < MAX_FOLLOWUPS; i++) reserveFollowUp("r1", NOW);
    expect(followUpsLeft("r1", NOW + READING_TOKEN_TTL_MS - 1)).toBe(0);
    expect(followUpsLeft("r1", NOW + READING_TOKEN_TTL_MS)).toBe(MAX_FOLLOWUPS);
  });
});
