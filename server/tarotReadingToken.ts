/**
 * אסימון קריאה חתום — שאלת המשך בטארוט אינה נספרת במכסה החודשית, ולכן צריך להבטיח
 * שהיא ניתנת רק למי שקיבל פירוש שנספר, ורק MAX_FOLLOWUPS פעמים לכל פירוש.
 * השרת מנפיק את האסימון כשפירוש הושלם; שאלת המשך דורשת אסימון תקף של אותו משתמש.
 *
 * האסימון אינו מכיל שאלה, קלפים או פירוש — רק מזהה אקראי, משתמש ותפוגה. שום דבר
 * מהקריאה לא נשמר בשרת. הוא חתום, ולכן שורד אתחול; מונה השימוש חי בזיכרון (dyno יחיד,
 * כמו מאגר העבודות וה-rate-limiter) ומתאפס באתחול — במקרה הגרוע עוד MAX_FOLLOWUPS שאלות.
 *
 * המודול טהור מבחינת סביבה: הסוד מוזרק, לא נקרא מ-env.
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { MAX_FOLLOWUPS } from "@shared/tarot";

/** תוקף האסימון — מספיק לקריאה נינוחה, קצר מכדי שיהפוך למלאי של שאלות חינם. */
export const READING_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

export type TokenCheck =
  | { ok: true; rid: string }
  | { ok: false; reason: "INVALID" | "EXPIRED" | "WRONG_USER" };

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** מספר שלם אי-שלילי בכתיב קנוני בלבד ("7", לא "07" / "7.0" / "+7"). */
function parseCanonicalInt(raw: string): number | null {
  if (!/^(0|[1-9]\d*)$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}

/** מנפיק אסימון: `<rid>.<userId>.<exp>.<sig>` — sig = HMAC-SHA256 על שלושת החלקים הראשונים. */
export function issueReadingToken(userId: number, secret: string, now: number = Date.now()): string {
  const payload = `${randomUUID()}.${userId}.${now + READING_TOKEN_TTL_MS}`;
  return `${payload}.${sign(payload, secret)}`;
}

/**
 * מאמת חתימה, בעלות ותפוגה — בסדר הזה, כך שאסימון מזויף לעולם אינו מגלה אם המשתמש
 * או התפוגה "כמעט" התאימו. אינו נוגע במונה השימוש.
 */
export function verifyReadingToken(
  token: string,
  userId: number,
  secret: string,
  now: number = Date.now(),
): TokenCheck {
  const invalid: TokenCheck = { ok: false, reason: "INVALID" };
  if (typeof token !== "string") return invalid;
  const parts = token.split(".");
  if (parts.length !== 4) return invalid;
  const [rid, rawUser, rawExp, sig] = parts;
  if (!rid || !sig) return invalid;

  const expected = Buffer.from(sign(`${rid}.${rawUser}.${rawExp}`, secret));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return invalid;

  const tokenUser = parseCanonicalInt(rawUser);
  const exp = parseCanonicalInt(rawExp);
  if (tokenUser === null || exp === null) return invalid;
  if (tokenUser !== userId) return { ok: false, reason: "WRONG_USER" };
  if (now >= exp) return { ok: false, reason: "EXPIRED" };
  return { ok: true, rid };
}

// ── מונה השימוש: כמה שאלות המשך כבר נתפסו לכל קריאה ──

interface UsageRecord {
  used: number;
  /** אחרי המועד הזה האסימון עצמו כבר פג — אפשר לשכוח את הרשומה. */
  expiresAt: number;
}

const usage = new Map<string, UsageRecord>();

function sweep(now: number): void {
  usage.forEach((rec, rid) => {
    if (now >= rec.expiresAt) usage.delete(rid);
  });
}

/**
 * תופס מקום אחד מתוך MAX_FOLLOWUPS עבור הקריאה. false = התקרה מוצתה.
 * תופסים *לפני* פתיחת העבודה ומשחררים בכישלון — כך שתי בקשות במקביל אינן עוקפות את התקרה.
 */
export function reserveFollowUp(rid: string, now: number = Date.now()): boolean {
  sweep(now);
  const rec = usage.get(rid) ?? { used: 0, expiresAt: now + READING_TOKEN_TTL_MS };
  if (rec.used >= MAX_FOLLOWUPS) return false;
  rec.used += 1;
  usage.set(rid, rec);
  return true;
}

/** משחרר מקום שנתפס (העבודה נכשלה) — count-on-success. */
export function releaseFollowUp(rid: string): void {
  const rec = usage.get(rid);
  if (rec && rec.used > 0) rec.used -= 1;
}

/** כמה שאלות המשך נותרו לקריאה. */
export function followUpsLeft(rid: string, now: number = Date.now()): number {
  sweep(now);
  return Math.max(0, MAX_FOLLOWUPS - (usage.get(rid)?.used ?? 0));
}

/** Test helper — מנקה את כל המונים. */
export function __resetFollowUps(): void {
  usage.clear();
}
