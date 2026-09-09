import { and, eq, sql } from "drizzle-orm";
import { tarotAiUsage } from "../../drizzle/schema";
import { getDb } from "./connection";
import { currentMonthYear } from "./ichingUsage";

/** מונה השימושים של המשתמש לחודש הנתון (0 אם אין רשומה / אין DB). */
export async function getTarotMonthlyUsage(
  userId: number,
  monthYear: string = currentMonthYear(),
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select()
    .from(tarotAiUsage)
    .where(and(eq(tarotAiUsage.userId, userId), eq(tarotAiUsage.monthYear, monthYear)))
    .limit(1);
  return rows[0]?.usageCount ?? 0;
}

/** increment אטומי דרך upsert (ON DUPLICATE KEY). מחזיר את המונה המעודכן. */
export async function incrementTarotMonthlyUsage(
  userId: number,
  monthYear: string = currentMonthYear(),
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(tarotAiUsage)
    .values({ userId, monthYear, usageCount: 1 })
    .onDuplicateKeyUpdate({
      set: { usageCount: sql`${tarotAiUsage.usageCount} + 1` },
    });
  return getTarotMonthlyUsage(userId, monthYear);
}
