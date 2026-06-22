import { and, eq, sql } from "drizzle-orm";
import { ichingAiUsage } from "../../drizzle/schema";
import { getDb } from "./connection";

/** "YYYY-MM" לפי UTC. */
export function currentMonthYear(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** מונה השימושים של המשתמש לחודש הנתון (0 אם אין רשומה / אין DB). */
export async function getMonthlyUsage(
  userId: number,
  monthYear: string = currentMonthYear(),
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select()
    .from(ichingAiUsage)
    .where(and(eq(ichingAiUsage.userId, userId), eq(ichingAiUsage.monthYear, monthYear)))
    .limit(1);
  return rows[0]?.usageCount ?? 0;
}

/** increment אטומי דרך upsert (ON DUPLICATE KEY). מחזיר את המונה המעודכן. */
export async function incrementMonthlyUsage(
  userId: number,
  monthYear: string = currentMonthYear(),
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(ichingAiUsage)
    .values({ userId, monthYear, usageCount: 1 })
    .onDuplicateKeyUpdate({
      set: { usageCount: sql`${ichingAiUsage.usageCount} + 1` },
    });
  return getMonthlyUsage(userId, monthYear);
}
