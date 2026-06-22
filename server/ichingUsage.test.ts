import { afterAll, describe, expect, it } from "vitest";
import mysql from "mysql2/promise";
import {
  currentMonthYear,
  getMonthlyUsage,
  incrementMonthlyUsage,
} from "./db/ichingUsage";

// userId ייחודי לריצה זו כדי לא להתנגש בנתונים קיימים / ריצות מקבילות.
const TEST_USER_ID = 900_000_000 + (Date.now() % 90_000_000);
const TEST_MONTH = "2999-01"; // חודש דמיוני — לא יתנגש בשימוש אמיתי.

describe("currentMonthYear (pure)", () => {
  it('formats a date as "YYYY-MM" in UTC', () => {
    expect(currentMonthYear(new Date("2026-06-22T10:00:00Z"))).toBe("2026-06");
    expect(currentMonthYear(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01");
    expect(currentMonthYear(new Date("2026-12-31T23:59:59Z"))).toBe("2026-12");
  });
});

describe("iching usage db access (requires MySQL)", () => {
  it("returns 0 when there is no row yet", async () => {
    expect(await getMonthlyUsage(TEST_USER_ID, TEST_MONTH)).toBe(0);
  });

  it("increments atomically via upsert (no duplicate rows)", async () => {
    expect(await incrementMonthlyUsage(TEST_USER_ID, TEST_MONTH)).toBe(1);
    expect(await incrementMonthlyUsage(TEST_USER_ID, TEST_MONTH)).toBe(2);
    expect(await getMonthlyUsage(TEST_USER_ID, TEST_MONTH)).toBe(2);
  });

  afterAll(async () => {
    if (!process.env.DATABASE_URL) return;
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    await conn.query(
      "DELETE FROM ichingAiUsage WHERE userId = ? AND monthYear = ?",
      [TEST_USER_ID, TEST_MONTH],
    );
    await conn.end();
  });
});
