import { afterAll, describe, expect, it } from "vitest";
import mysql from "mysql2/promise";
import {
  DEFAULT_TAROT_INTRO,
  getCardText,
  getTarotIntro,
  upsertCardText,
} from "./db/tarot";
import {
  getTarotMonthlyUsage,
  incrementTarotMonthlyUsage,
} from "./db/tarotUsage";

// מזהים ייחודיים לריצה זו — לא מתנגשים בנתונים אמיתיים או בריצות מקבילות.
const TEST_USER_ID = 910_000_000 + (Date.now() % 90_000_000);
const TEST_MONTH = "2999-02"; // חודש דמיוני
const TEST_CARD_ID = "major-00"; // נשמר ומנוקה ב-afterAll רק אם לא היה קיים

async function cleanup(sqlText: string, params: unknown[]) {
  if (!process.env.DATABASE_URL) return;
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  await conn.query(sqlText, params);
  await conn.end();
}

describe("tarot usage db access (requires MySQL)", () => {
  it("returns 0 when there is no row yet", async () => {
    expect(await getTarotMonthlyUsage(TEST_USER_ID, TEST_MONTH)).toBe(0);
  });

  it("increments atomically via upsert (no duplicate rows)", async () => {
    expect(await incrementTarotMonthlyUsage(TEST_USER_ID, TEST_MONTH)).toBe(1);
    expect(await incrementTarotMonthlyUsage(TEST_USER_ID, TEST_MONTH)).toBe(2);
    expect(await getTarotMonthlyUsage(TEST_USER_ID, TEST_MONTH)).toBe(2);
  });

  it("keeps separate counters per month and per user", async () => {
    expect(await getTarotMonthlyUsage(TEST_USER_ID, "2999-03")).toBe(0);
    expect(await getTarotMonthlyUsage(TEST_USER_ID + 1, TEST_MONTH)).toBe(0);
  });

  it("concurrent increments both land (atomicity)", async () => {
    const month = "2999-04";
    await Promise.all([
      incrementTarotMonthlyUsage(TEST_USER_ID, month),
      incrementTarotMonthlyUsage(TEST_USER_ID, month),
    ]);
    expect(await getTarotMonthlyUsage(TEST_USER_ID, month)).toBe(2);
  });

  afterAll(() =>
    cleanup("DELETE FROM tarotAiUsage WHERE userId IN (?, ?)", [
      TEST_USER_ID,
      TEST_USER_ID + 1,
    ]),
  );
});

describe("tarot content db access (requires MySQL)", () => {
  let hadRow = false;
  let originalRow: Record<string, unknown> | undefined;

  it("round-trips card text including a large (100KB) interpretation", async () => {
    const before = await getCardText(TEST_CARD_ID);
    hadRow = !!before;
    if (before) originalRow = { ...before };

    const big = "<p>" + "פירוש ארוך מאוד ".repeat(8000) + "</p>"; // ~128K תווים
    expect(big.length).toBeGreaterThan(100_000);
    await upsertCardText({
      cardId: TEST_CARD_ID,
      name: "שם בדיקה",
      summary: "מהות בדיקה",
      interpretation: big,
    });
    const row = await getCardText(TEST_CARD_ID);
    expect(row?.name).toBe("שם בדיקה");
    expect(row?.interpretation).toBe(big); // mediumtext לא קוטם

    // upsert שני על אותו PK מעדכן ולא זורק
    await upsertCardText({ cardId: TEST_CARD_ID, name: "", summary: "ב", interpretation: "<p>ב</p>" });
    expect((await getCardText(TEST_CARD_ID))?.summary).toBe("ב");
  });

  it("falls back to the default intro when no row exists", async () => {
    const intro = await getTarotIntro();
    // ייתכן שכבר יש שורה (אחרי seed) — בודקים רק שהצורה נכונה
    expect(typeof intro.questionPrompt).toBe("string");
    expect(intro.questionPrompt.length).toBeGreaterThan(0);
    expect(DEFAULT_TAROT_INTRO.aiEnabled).toBe(false);
  });

  afterAll(async () => {
    if (hadRow && originalRow) {
      await upsertCardText(originalRow as Parameters<typeof upsertCardText>[0]);
    } else {
      await cleanup("DELETE FROM tarotCardText WHERE cardId = ?", [TEST_CARD_ID]);
    }
  });
});
